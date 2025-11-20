import { useCallback, useEffect, useMemo, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { doc, getDoc, collection, query, where, limit, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';

const STORAGE_KEY = 'carrito';
const META_KEY = STORAGE_KEY + '_meta';
const CUPON_KEY = STORAGE_KEY + '_cupon';

function safeParse(raw, fallback) {
  try { return raw ? JSON.parse(raw) : fallback; } catch (e) { return fallback; }
}

function loadMeta() {
  return safeParse(localStorage.getItem(META_KEY), {});
}

function persistMeta(meta) {
  try { localStorage.setItem(META_KEY, JSON.stringify(meta)); } catch (e) { /* noop */ }
}

function loadCartRaw() {
  return safeParse(localStorage.getItem(STORAGE_KEY), []);
}

function persistCart(cart) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cart)); } catch (e) { /* noop */ }
}

export default function useCart() {
  const history = useHistory();
  const [cart, setCart] = useState([]); // [{ id, qty }]
  const [meta, setMeta] = useState({}); // { id: { nombre, precio, precioOferta, imagen, stock } }
  const [cupon, setCupon] = useState(localStorage.getItem(CUPON_KEY) || '');
  const toast = useToast();

  // load on mount
  useEffect(() => {
    const raw = loadCartRaw();
    // normalize to {id, qty}
    const normalized = Array.isArray(raw) ? raw.map(i => ({ id: String(i.id), qty: Math.max(1, Number(i.qty) || 1) })) : [];
    setCart(normalized);
    setMeta(loadMeta());
  }, []);

  const updateStorageAndNotify = useCallback((newCart, newMeta) => {
    setCart(newCart);
    if (newMeta) {
      setMeta(newMeta);
      persistMeta(newMeta);
    }
    persistCart(newCart);
    try { window.dispatchEvent(new Event('storage')); } catch (e) { /* noop */ }
  }, []);

  const enrichFromFirestore = useCallback(async () => {
    try {
      if (!db) return {};
      const current = loadCartRaw();
      const ids = (Array.isArray(current) ? current.map(i => String(i.id)) : []).filter(Boolean);
      if (!ids.length) return {};
      const curMeta = { ...loadMeta() };
      const results = {};

      await Promise.all(ids.map(async id => {
        try {
          // try by doc id
          let snap = await getDoc(doc(db, 'productos', id));
          let d = null;
          if (snap && snap.exists()) d = { id: snap.id, ...snap.data() };
          if (!d) {
            let q = query(collection(db, 'productos'), where('cod', '==', id), limit(1));
            let qSnap = await getDocs(q);
            if (!qSnap.empty && qSnap.docs.length) { const ds = qSnap.docs[0]; d = { id: ds.id, ...ds.data() }; }
          }
          if (!d) {
            let q = query(collection(db, 'productos'), where('codigo', '==', id), limit(1));
            let qSnap = await getDocs(q);
            if (!qSnap.empty && qSnap.docs.length) { const ds = qSnap.docs[0]; d = { id: ds.id, ...ds.data() }; }
          }
          if (!d) {
            snap = await getDoc(doc(db, 'producto_oferta', id));
            if (snap && snap.exists()) d = { id: snap.id, ...snap.data() };
          }
          if (!d) {
            let q2 = query(collection(db, 'producto_oferta'), where('cod', '==', id), limit(1));
            let q2Snap = await getDocs(q2);
            if (!q2Snap.empty && q2Snap.docs.length) { const ds = q2Snap.docs[0]; d = { id: ds.id, ...ds.data() }; }
          }
          if (!d) {
            let q2 = query(collection(db, 'producto_oferta'), where('codigo', '==', id), limit(1));
            let q2Snap = await getDocs(q2);
            if (!q2Snap.empty && q2Snap.docs.length) { const ds = q2Snap.docs[0]; d = { id: ds.id, ...ds.data() }; }
          }

          if (d) {
            const nombre = d.nombre || d.name || d.title || d.nombreProducto || curMeta[id]?.nombre || d.cod || id;
            const precio = Number(d.precio || d.price || 0) || 0;
            const precioOfertaFS = (typeof d.precio_oferta === 'number' && d.precio_oferta > 0) ? Number(d.precio_oferta)
                                  : (typeof d.precioOferta === 'number' && d.precioOferta > 0) ? Number(d.precioOferta)
                                  : undefined;
            const imagen = d.imagen || d.img || d.imagenURL || d.imagen_url || '';
            const stock = (d.stock !== undefined) ? (Number(d.stock) || 0) : (d.cantidad !== undefined ? Number(d.cantidad) : null);

            curMeta[id] = {
              nombre,
              precio: (precio || curMeta[id]?.precio || 0),
              precioOferta: (typeof precioOfertaFS !== 'undefined') ? precioOfertaFS : curMeta[id]?.precioOferta,
              imagen: imagen || curMeta[id]?.imagen || '',
              stock: (stock !== null && !Number.isNaN(stock)) ? stock : curMeta[id]?.stock
            };
            results[id] = curMeta[id];
          }
        } catch (e) {
          console.warn('enrich error', e);
        }
      }));

      if (Object.keys(results).length) {
        setMeta(curMeta);
        persistMeta(curMeta);
        try { updateStorageAndNotify(loadCartRaw(), curMeta); } catch (e) {}
      }
      return results;
    } catch (e) { console.warn('enrichFromFirestore failed', e); return {}; }
  }, [updateStorageAndNotify]);

  const calcularTotales = useCallback(() => {
    const fuentes = (window.productosGlobal && window.productosGlobal.length) ? window.productosGlobal
                  : (window.PRODUCTOS_MOCK && window.PRODUCTOS_MOCK.length) ? window.PRODUCTOS_MOCK
                  : (window.PRODUCTOS && window.PRODUCTOS.length) ? window.PRODUCTOS
                  : [];

    const detalles = cart.map(i => {
      const p = fuentes.find(pp => (String(pp.id) === String(i.id) || String(pp.cod) === String(i.id))) || null;
      const m = meta[String(i.id)] || {};

      let precio = 0;
      if (typeof m.precioOferta === 'number' && m.precioOferta > 0) {
        precio = Number(m.precioOferta);
      } else if (p) {
        const po = (typeof p.precio_oferta === 'number') ? p.precio_oferta : (typeof p.precioOferta === 'number' ? p.precioOferta : undefined);
        if (typeof po === 'number' && po > 0) precio = Number(po);
        else precio = Number(p.precio || p.price || 0);
      } else {
        precio = Number(m.precio || 0);
      }

      const subtotal = precio * (Number(i.qty) || 0);
      const stock = (p && (p.stock !== undefined)) ? Number(p.stock) : (m.stock !== undefined ? Number(m.stock) : null);
      const nombre = p ? (p.nombre || p.name || p.title) : (m.nombre || i.id);
      const imagen = (p && (p.imagen || p.img)) ? (p.imagen || p.img) : (m.imagen || '');

      return { id: i.id, qty: Number(i.qty) || 0, producto: p, precio, subtotal, meta: m, stock, nombre, imagen };
    });

    const total = detalles.reduce((s, d) => s + d.subtotal, 0);
    let descuento = 0;
    const codigo = (cupon || '').toUpperCase();
    if (codigo === 'DESCUENTO10' || codigo === 'DUOCUC') descuento = Math.round(total * 0.10);
    const totalConDescuento = Math.max(0, total - descuento);
    return { detalles, total, descuento, totalConDescuento };
  }, [cart, meta, cupon]);

  const totals = useMemo(() => calcularTotales(), [calcularTotales]);

  const addItem = useCallback((prodOrId, qtyParam = 1) => {
    let qtyToAdd = 1;
    if (typeof prodOrId === 'object' && prodOrId !== null && prodOrId.qty !== undefined) {
      qtyToAdd = Math.max(1, Number(prodOrId.qty) || 1);
    } else {
      qtyToAdd = Math.max(1, Number(qtyParam) || 1);
    }

    let id, nombre, precio, precioOferta, imagen, stock;
    if (typeof prodOrId === 'string') id = prodOrId;
    else if (typeof prodOrId === 'object' && prodOrId !== null) {
      id = prodOrId.id || prodOrId.cod || prodOrId.codigo;
      nombre = prodOrId.nombre || prodOrId.name || prodOrId.title;
      precio = Number(prodOrId.precio || prodOrId.price || 0);
      precioOferta = (typeof prodOrId.precioOferta === 'number' && prodOrId.precioOferta > 0) ? Number(prodOrId.precioOferta)
                    : (typeof prodOrId.precio_oferta === 'number' && prodOrId.precio_oferta > 0) ? Number(prodOrId.precio_oferta)
                    : undefined;
      imagen = prodOrId.imagen || prodOrId.img || prodOrId.imagenURL || '';
      stock = prodOrId.stock !== undefined ? Number(prodOrId.stock) : null;
    }
    if (!id) return;

    const curCart = loadCartRaw();
    const normalized = Array.isArray(curCart) ? curCart.map(i => ({ id: String(i.id), qty: Math.max(1, Number(i.qty) || 1) })) : [];
    const idx = normalized.findIndex(i => String(i.id) === String(id));
    const curMeta = { ...loadMeta() };

    if (typeof id !== 'undefined') {
      curMeta[String(id)] = {
        ...(curMeta[String(id)] || {}),
        nombre: nombre || curMeta[String(id)]?.nombre || String(id),
        precio: Number(curMeta[String(id)]?.precio || precio || 0),
        precioOferta: (typeof precioOferta !== 'undefined') ? precioOferta : curMeta[String(id)]?.precioOferta,
        imagen: imagen || curMeta[String(id)]?.imagen || '',
        stock: (stock !== null && !Number.isNaN(stock)) ? stock : curMeta[String(id)]?.stock
      };
      persistMeta(curMeta);
    }

    if (idx >= 0) {
      const newQty = Number(normalized[idx].qty || 0) + qtyToAdd;
      const available = curMeta[String(id)]?.stock;
      if (available !== undefined && available !== null && newQty > available) {
        try { toast.showToast('No hay suficiente stock disponible.', { type: 'error' }); } catch (e) { /* noop */ }
        return;
      }
      normalized[idx].qty = newQty;
    } else {
      normalized.push({ id: String(id), qty: qtyToAdd });
    }

    updateStorageAndNotify(normalized, curMeta);
    try { window.dispatchEvent(new CustomEvent('carrito:added', { detail: { id, qty: qtyToAdd } })); } catch (e) {}
  }, [updateStorageAndNotify]);

  const changeQty = useCallback((id, nuevaQty) => {
    const curMeta = loadMeta();
    nuevaQty = Number(nuevaQty) || 0;
    const available = curMeta[String(id)]?.stock;
    if (available !== undefined && available !== null && nuevaQty > available) {
      try { toast.showToast('No hay suficiente stock para esa cantidad.', { type: 'error' }); } catch (e) {}
      nuevaQty = available;
    }
    const normalized = cart.map(i => i.id === id ? { ...i, qty: nuevaQty } : i).filter(i => i.qty > 0);
    updateStorageAndNotify(normalized);
  }, [cart, updateStorageAndNotify]);

  const removeItem = useCallback((id) => {
    const normalized = cart.filter(i => String(i.id) !== String(id));
    updateStorageAndNotify(normalized);
  }, [cart, updateStorageAndNotify]);

  const clearCart = useCallback(() => {
    updateStorageAndNotify([], {});
    try { localStorage.removeItem(CUPON_KEY); setCupon(''); } catch (e) {}
  }, [updateStorageAndNotify]);

  const applyCoupon = useCallback((codigo) => {
    const c = (codigo || '').trim().toUpperCase();
    if (!c) return false;
    if (c === 'DESCUENTO10' || c === 'DUOCUC') {
      try { localStorage.setItem(CUPON_KEY, c); } catch (e) {}
      setCupon(c);
      return true;
    }
    try { localStorage.removeItem(CUPON_KEY); } catch (e) {}
    setCupon('');
    return false;
  }, []);

  const checkout = useCallback(() => {
    history.push('/checkout');
  }, [history]);

  // Keep badge updated (if element exists)
  useEffect(() => {
    const totalItems = cart.reduce((s, i) => s + (Number(i.qty) || 0), 0);
    const badge = document.querySelector('#badge-carrito');
    if (badge) badge.textContent = totalItems ? String(totalItems) : '';
  }, [cart]);

  return {
    items: totals.detalles,
    total: totals.total,
    descuento: totals.descuento,
    totalConDescuento: totals.totalConDescuento,
    cupon,
    addItem,
    changeQty,
    removeItem,
    applyCoupon,
    clearCart,
    enrichFromFirestore,
    checkout
  };
}
