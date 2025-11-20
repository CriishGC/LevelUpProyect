import { useCallback, useEffect, useState } from 'react';
import { doc, getDoc, collection, query, where, limit, getDocs, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useToast } from '../context/ToastContext';

function safeParse(raw, fallback) {
  try { return raw ? JSON.parse(raw) : fallback; } catch (e) { return fallback; }
}

function readCartFromStorage(){
  try{
    const raw = localStorage.getItem('carrito') || '[]';
    const parsed = safeParse(raw, []);
    const metaRaw = localStorage.getItem('carrito_meta') || localStorage.getItem('carritoMeta') || '{}';
    const meta = safeParse(metaRaw, {});
    return { items: Array.isArray(parsed)?parsed:[], meta: meta };
  }catch(e){ console.warn('Error leyendo carrito localStorage', e); return { items: [], meta: {} }; }
}

function getProductSources(){
  return (window.productosGlobal && window.productosGlobal.length) ? window.productosGlobal
    : (window.PRODUCTOS_MOCK && window.PRODUCTOS_MOCK.length) ? window.PRODUCTOS_MOCK
    : (window.PRODUCTOS && window.PRODUCTOS.length) ? window.PRODUCTOS
    : [];
}

function generateOrderCode(){
  const a = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  let s = '';
  for(let i=0;i<8;i++) s += a[Math.floor(Math.random()*a.length)];
  return s;
}

export default function useCheckout(){
  const [detalles, setDetalles] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const toast = useToast();

  const buildOrderDetails = useCallback(() => {
    const { items, meta } = readCartFromStorage();
    const pool = getProductSources();
    const detallesLocal = items.map(i => {
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
    const totalLocal = detallesLocal.reduce((s,d)=>s+d.subtotal,0);
    setDetalles(detallesLocal);
    setTotal(totalLocal);
    return { detalles: detallesLocal, total: totalLocal };
  }, []);

  useEffect(() => {
    buildOrderDetails();
  }, [buildOrderDetails]);

  async function ensureFirebase(){
    try{
      if (db) return { ok: true, db };
    }catch(e){ console.warn('Error comprobando firebase modular', e); }
    return { ok:false };
  }

  async function submitOrder(buyer){
    setLoading(true);
    setMessage(null);
    try{
      const { detalles: dets, total: tot } = buildOrderDetails();
      if (!dets.length) { setMessage({ type: 'error', text: 'El carrito está vacío.' }); setLoading(false); return { ok:false, message: 'Carrito vacío' }; }

      const orderCode = generateOrderCode();
      const createdAt = new Date();

      const fb = await ensureFirebase();
      if (!fb.ok){
        const order = { code: orderCode, buyer, items: dets, total: tot, createdAt: createdAt.toISOString(), status: 'SIMULATED_NO_FIREBASE' };
        try{ localStorage.removeItem('carrito'); localStorage.removeItem('carrito_meta'); localStorage.removeItem('carrito_cupon'); }catch(e){}
        try{ if (typeof window.actualizarCarritoUI === 'function') window.actualizarCarritoUI(); }catch(e){}
        setMessage({ type: 'success', text: `Compra simulada. Código: ${orderCode}` });
        setLoading(false);
        return { ok:true, code: orderCode, simulated: true };
      }

      const dbMod = fb.db;
      // prepare lookups similar to original using modular API
      const lookups = await Promise.all(dets.map(async (it) => {
        const idStr = String(it.id);
        try{
          const docRef = doc(dbMod, 'productos', idStr);
          const snap = await getDoc(docRef);
          if (snap && snap.exists()) return { type: 'doc', ref: docRef, snap };

          let q = query(collection(dbMod, 'productos'), where('cod', '==', idStr), limit(1));
          let qSnap = await getDocs(q);
          if (!qSnap.empty && qSnap.docs.length) return { type: 'doc', ref: doc(dbMod, 'productos', qSnap.docs[0].id), snap: qSnap.docs[0] };

          q = query(collection(dbMod, 'productos'), where('codigo', '==', idStr), limit(1));
          qSnap = await getDocs(q);
          if (!qSnap.empty && qSnap.docs.length) return { type: 'doc', ref: doc(dbMod, 'productos', qSnap.docs[0].id), snap: qSnap.docs[0] };

          const ofertaDocRef = doc(dbMod, 'producto_oferta', idStr);
          const ofertaSnap = await getDoc(ofertaDocRef);
          if (ofertaSnap && ofertaSnap.exists()) return { type: 'doc', ref: ofertaDocRef, snap: ofertaSnap };

          let q2 = query(collection(dbMod, 'producto_oferta'), where('cod','==', idStr), limit(1));
          let q2Snap = await getDocs(q2);
          if (!q2Snap.empty && q2Snap.docs.length) return { type: 'doc', ref: doc(dbMod, 'producto_oferta', q2Snap.docs[0].id), snap: q2Snap.docs[0] };

          q2 = query(collection(dbMod, 'producto_oferta'), where('codigo','==', idStr), limit(1));
          q2Snap = await getDocs(q2);
          if (!q2Snap.empty && q2Snap.docs.length) return { type: 'doc', ref: doc(dbMod, 'producto_oferta', q2Snap.docs[0].id), snap: q2Snap.docs[0] };
        }catch(e){ console.warn('lookup error', e); }
        return { type: 'missing', id: idStr };
      }));

      const missing = lookups.filter(x => x.type === 'missing');
      if (missing.length) throw new Error(`Producto no encontrado en Firestore: ${missing.map(m=>m.id).join(', ')}`);

      await runTransaction(dbMod, async (tx) => {
        const txSnaps = await Promise.all(lookups.map(lu => tx.get(lu.ref)));
        txSnaps.forEach((snap, idx) => {
          const it = dets[idx];
          if (!snap.exists()) throw new Error(`Producto no encontrado en Firestore: ${it.id}`);
          const data = snap.data() || {};
          const stockField = (data.stock !== undefined) ? 'stock' : (data.cantidad !== undefined ? 'cantidad' : null);
          if (stockField){
            const current = Number(data[stockField] || 0);
            const remaining = current - Number(it.qty || 0);
            if (remaining < 0) throw new Error(`Stock insuficiente para producto ${it.id} (disponible: ${current}, pedido: ${it.qty})`);
          }
        });

        txSnaps.forEach((snap, idx) => {
          const it = dets[idx];
          const data = snap.data() || {};
          const stockField = (data.stock !== undefined) ? 'stock' : (data.cantidad !== undefined ? 'cantidad' : null);
          if (stockField){
            const current = Number(data[stockField] || 0);
            const remaining = current - Number(it.qty || 0);
            tx.update(lookups[idx].ref, { [stockField]: remaining });
          }
        });

        const orderRef = doc(collection(dbMod, 'orders'));
        const orderData = {
          code: orderCode,
          buyer: buyer,
          items: dets.map(d => ({ id: d.id, nombre: d.nombre, precio: d.precio, qty: d.qty })),
          total: tot,
          createdAt: serverTimestamp(),
          status: 'CONFIRMED'
        };
        tx.set(orderRef, orderData);
      });

      try{ localStorage.removeItem('carrito'); localStorage.removeItem('carrito_meta'); localStorage.removeItem('carrito_cupon'); }catch(e){}
      try{ if (typeof window.actualizarCarritoUI === 'function') window.actualizarCarritoUI(); }catch(e){}
      setMessage({ type: 'success', text: `Compra realizada con éxito. Código: ${orderCode}` });
      setLoading(false);
      return { ok:true, code: orderCode };
    }catch(err){
      console.error('Error al procesar la orden:', err);
      const text = err && err.message ? err.message : String(err);
      setMessage({ type: 'error', text: `Error procesando la orden: ${text}` });
      setLoading(false);
      return { ok:false, error: err };
    }
  }

  return { detalles, total, loading, message, buildOrderDetails, submitOrder };
}
