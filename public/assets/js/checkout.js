(function(){
  'use strict';

  if (typeof window.formateaCLP === 'undefined') {
    window.formateaCLP = function formateaCLP(n){ return `$ ${Number(n||0).toLocaleString('es-CL')}`; };
  }

  function readCartFromStorage(){
    try{
      const raw = localStorage.getItem('carrito') || '[]';
      const parsed = JSON.parse(raw);
      const metaRaw = localStorage.getItem('carrito_meta') || '{}';
      const meta = JSON.parse(metaRaw);
      return { items: Array.isArray(parsed)?parsed:[], meta: meta };
    }catch(e){ console.warn('Error leyendo carrito localStorage', e); return { items: [], meta: {} }; }
  }

  function getProductSources(){
    return (window.productosGlobal && window.productosGlobal.length) ? window.productosGlobal
      : (window.PRODUCTOS_MOCK && window.PRODUCTOS_MOCK.length) ? window.PRODUCTOS_MOCK
      : (window.PRODUCTOS && window.PRODUCTOS.length) ? window.PRODUCTOS
      : [];
  }

  function buildOrderDetails(){
    const { items, meta } = readCartFromStorage();
    const pool = getProductSources();
    const detalles = items.map(i => {
      const p = pool.find(pp => (String(pp.id) === String(i.id) || String(pp.cod) === String(i.id))) || null;

      const nombre = p ? (p.nombre || p.name || p.title) : (meta[i.id] && meta[i.id].nombre) || i.id;

      let precio = 0;
      if (meta && meta[i.id] && typeof meta[i.id].precioOferta !== 'undefined' && meta[i.id].precioOferta !== null) {
        precio = Number(meta[i.id].precioOferta) || 0;
      } else if (p) {
        const po = (typeof p.precio_oferta === 'number') ? p.precio_oferta
                 : (typeof p.precioOferta === 'number') ? p.precioOferta
                 : (typeof p.precio_oferta === 'string' && !isNaN(Number(p.precio_oferta))) ? Number(p.precio_oferta)
                 : undefined;
        if (typeof po !== 'undefined' && po !== null && !Number.isNaN(po) && Number(po) > 0) {
          precio = Number(po);
        } else {
          precio = Number(p.precio || p.price || 0);
        }
      } else {
        precio = Number((meta[i.id] && meta[i.id].precio) || 0);
      }

      const subtotal = precio * (Number(i.qty) || 0);
      return { id: i.id, qty: Number(i.qty)||0, nombre, precio, subtotal };
    });
    const total = detalles.reduce((s,d)=>s+d.subtotal,0);
    return { detalles, total };
  }

  function renderCheckoutSummary(){
    const cont = document.getElementById('checkout-items');
    const totalEl = document.getElementById('checkout-total');
    if (!cont || !totalEl) return;
    const { detalles, total } = buildOrderDetails();
    if (!detalles.length){ cont.innerHTML = '<div class="alert alert-secondary">Carrito vacío.</div>'; totalEl.textContent = formateaCLP(0); return; }
    cont.innerHTML = detalles.map(d => `
      <div class="d-flex align-items-center mb-2">
        <div class="flex-grow-1">
          <div class="small fw-bold">${d.nombre}</div>
          <div class="small text-muted">${formateaCLP(d.precio)} × ${d.qty}</div>
        </div>
        <div class="text-end fw-bold">${formateaCLP(d.subtotal)}</div>
      </div>
    `).join('');
    totalEl.textContent = formateaCLP(total);
  }

  function ensureFirebase(){
    return new Promise(resolve => {
      try{
        if (window.firebase && firebase.initializeApp){
          if (!firebase.apps || !firebase.apps.length){
            const conf = window.__LVUP_FIREBASE_CONFIG || {};
            if (Object.keys(conf).length) firebase.initializeApp(conf);
          }
          resolve({ ok:true, db: firebase.firestore() });
        } else {
          resolve({ ok:false });
        }
      }catch(e){ console.warn('Error inicializando firebase en checkout', e); resolve({ ok:false }); }
    });
  }

  function generateOrderCode(){
    const a = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let s = '';
    for(let i=0;i<8;i++) s += a[Math.floor(Math.random()*a.length)];
    return s;
  }

  async function placeOrder(event){
    event && event.preventDefault();
    const form = document.getElementById('checkout-form');
    if (!form) return;
    if (!form.checkValidity()){
      form.classList.add('was-validated');
      return;
    }

    const name = document.getElementById('buyer-name').value.trim();
    const email = document.getElementById('buyer-email').value.trim();
    const phone = document.getElementById('buyer-phone').value.trim();
    const addr1 = document.getElementById('addr-line1').value.trim();
    const city = document.getElementById('addr-city').value.trim();
    const region = document.getElementById('addr-region').value.trim();
    const zip = document.getElementById('addr-zip').value.trim();
    const notes = document.getElementById('order-notes').value.trim();

    const { detalles, total } = buildOrderDetails();
    if (!detalles.length){ alert('El carrito está vacío.'); return; }

    const buyer = { name, email, phone, address: { line1: addr1, city, region, zip }, notes };
    const orderCode = generateOrderCode();
    const createdAt = new Date();

    const fb = await ensureFirebase();
    const messageEl = document.getElementById('checkout-message');

    if (!fb.ok){
      const order = { code: orderCode, buyer, items: detalles, total, createdAt: createdAt.toISOString(), status: 'SIMULATED_NO_FIREBASE' };
      localStorage.removeItem('carrito');
      localStorage.removeItem('carrito_meta');
      localStorage.removeItem('carrito_cupon');
      if (typeof window.actualizarCarritoUI === 'function') try{ window.actualizarCarritoUI(); }catch(e){}
      messageEl && (messageEl.innerHTML = `<div class="alert alert-success">Compra simulada. Código: <strong>${orderCode}</strong></div>`);
      return;
    }

    const db = fb.db;
    try{
      const orderRef = db.collection('orders').doc();

      const lookups = await Promise.all(detalles.map(async (it) => {
        const idStr = String(it.id);
        const docRef = db.collection('productos').doc(idStr);
        const snap = await docRef.get();
        if (snap && snap.exists) {
          return { type: 'doc', ref: docRef, snap };
        }
        let q = await db.collection('productos').where('cod', '==', idStr).limit(1).get();
        if (!q.empty && q.docs.length) {
          return { type: 'doc', ref: db.collection('productos').doc(q.docs[0].id), snap: q.docs[0] };
        }
        q = await db.collection('productos').where('codigo', '==', idStr).limit(1).get();
        if (!q.empty && q.docs.length) {
          return { type: 'doc', ref: db.collection('productos').doc(q.docs[0].id), snap: q.docs[0] };
        }
        const ofertaDocRef = db.collection('producto_oferta').doc(idStr);
        const ofertaSnap = await ofertaDocRef.get();
        if (ofertaSnap && ofertaSnap.exists) {
          return { type: 'doc', ref: ofertaDocRef, snap: ofertaSnap };
        }
        let q2 = await db.collection('producto_oferta').where('cod', '==', idStr).limit(1).get();
        if (!q2.empty && q2.docs.length) {
          return { type: 'doc', ref: db.collection('producto_oferta').doc(q2.docs[0].id), snap: q2.docs[0] };
        }
        q2 = await db.collection('producto_oferta').where('codigo', '==', idStr).limit(1).get();
        if (!q2.empty && q2.docs.length) {
          return { type: 'doc', ref: db.collection('producto_oferta').doc(q2.docs[0].id), snap: q2.docs[0] };
        }

        return { type: 'missing', id: idStr };
      }));

      const missing = lookups.filter(x => x.type === 'missing');
      if (missing.length) {
        throw new Error(`Producto no encontrado en Firestore: ${missing.map(m=>m.id).join(', ')}`);
      }

      await db.runTransaction(async tx => {
        const txSnaps = await Promise.all(lookups.map(lu => tx.get(lu.ref)));
        txSnaps.forEach((snap, idx) => {
          const it = detalles[idx];
          if (!snap.exists) throw new Error(`Producto no encontrado en Firestore: ${it.id}`);
          const data = snap.data() || {};
          const stockField = (data.stock !== undefined) ? 'stock' : (data.cantidad !== undefined ? 'cantidad' : null);
          if (stockField){
            const current = Number(data[stockField] || 0);
            const remaining = current - Number(it.qty || 0);
            if (remaining < 0) throw new Error(`Stock insuficiente para producto ${it.id} (disponible: ${current}, pedido: ${it.qty})`);
          }
        });

        txSnaps.forEach((snap, idx) => {
          const it = detalles[idx];
          const data = snap.data() || {};
          const stockField = (data.stock !== undefined) ? 'stock' : (data.cantidad !== undefined ? 'cantidad' : null);
          if (stockField){
            const current = Number(data[stockField] || 0);
            const remaining = current - Number(it.qty || 0);
            tx.update(lookups[idx].ref, { [stockField]: remaining });
          }
        });

        const orderData = {
          code: orderCode,
          buyer: buyer,
          items: detalles.map(d => ({ id: d.id, nombre: d.nombre, precio: d.precio, qty: d.qty })),
          total: total,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          status: 'CONFIRMED'
        };
        tx.set(orderRef, orderData);
      });

      localStorage.removeItem('carrito');
      localStorage.removeItem('carrito_meta');
      localStorage.removeItem('carrito_cupon');
      if (typeof window.actualizarCarritoUI === 'function') try{ window.actualizarCarritoUI(); }catch(e){}
      messageEl && (messageEl.innerHTML = `<div class="alert alert-success">Compra realizada con éxito. Código: <strong>${orderCode}</strong></div>`);
    }catch(err){
      console.error('Error al procesar la orden:', err);
      const text = err && err.message ? err.message : String(err);
      messageEl && (messageEl.innerHTML = `<div class="alert alert-danger">Error procesando la orden: ${text}</div>`);
    }
  }

  document.addEventListener('DOMContentLoaded', function(){
    renderCheckoutSummary();
    const form = document.getElementById('checkout-form');
    if (form) form.addEventListener('submit', placeOrder);
    if (typeof window.actualizarCarritoUI === 'function'){
      try{ window.actualizarCarritoUI(); }catch(e){}
    }
  });

})();