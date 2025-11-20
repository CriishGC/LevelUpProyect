import { collection, getDocs, query, where, limit, orderBy, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';

async function getAllProducts() {
  try {
    const col = collection(db, 'producto');
    const snap = await getDocs(col);
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (e) {
    console.warn('getAllProducts failed:', e);
    return [];
  }
}

async function getOfferProducts() {
  try {
    // Prefer dedicated oferta collection
    const col = collection(db, 'producto_oferta');
    const snap = await getDocs(col);
    if (snap && !snap.empty) return snap.docs.map(d => ({ id: d.id, ...d.data() }));

    // fallback: fetch all products and filter client-side
    const all = await getAllProducts();
    return all.filter(p => {
      const precio = Number(p.precio || 0);
      const po = Number(p.precio_oferta || p.precioOferta || 0) || 0;
      if (po > 0 && po < precio) return true;
      if (p.oferta === true) return true;
      if (typeof p.descuento === 'number' && p.descuento > 0) return true;
      const text = ((p.nombre||'') + ' ' + (p.descripcion||p.desc||'') + ' ' + (p.categoria||p.cat||'')).toLowerCase();
      return text.includes('oferta') || text.includes('promo') || text.includes('descuento');
    });
  } catch (e) {
    console.warn('getOfferProducts failed:', e);
    return [];
  }
}

async function getProductByCodOrId(identifier) {
  try {
    if (!identifier) return null;
    const all = await getAllProducts();
    return all.find(p => String(p.cod) === String(identifier) || String(p.id) === String(identifier) || String(p.codigo) === String(identifier)) || null;
  } catch (e) {
    console.warn('getProductByCodOrId failed:', e);
    return null;
  }
}

async function saveReview(productIdOrCod, name, rating, comment) {
  try {
    const col = collection(db, 'producto_reviews');
    const docRef = await addDoc(col, {
      productCod: String(productIdOrCod || ''),
      name: name || 'Anon',
      rating: Number(rating) || 0,
      comment: comment || '',
      createdAt: serverTimestamp()
    });
    return { ok: true, id: docRef.id };
  } catch (e) {
    console.warn('saveReview failed:', e);
    return { ok: false, error: e };
  }
}

async function loadReviewsForProduct(product) {
  try {
    if (!product) return [];
    const candidates = [];
    if (product.cod) candidates.push(String(product.cod));
    if (product.id) candidates.push(String(product.id));
    if (product.codigo) candidates.push(String(product.codigo));
    const uniq = Array.from(new Set(candidates)).filter(Boolean);
    if (!uniq.length) return [];

    const col = collection(db, 'producto_reviews');
    const results = [];
    for (const cand of uniq) {
      try {
        const q = query(col, where('productCod', '==', cand), orderBy('createdAt', 'desc'), limit(50));
        const snap = await getDocs(q);
        snap.forEach(d => results.push({ id: d.id, ...d.data() }));
      } catch (e) { /* ignore per candidate */ }
    }
    // dedupe by id
    const map = new Map();
    results.forEach(r => map.set(r.id, r));
    return Array.from(map.values()).slice(0,50);
  } catch (e) {
    console.warn('loadReviewsForProduct failed:', e);
    return [];
  }
}

export { getAllProducts, getOfferProducts, getProductByCodOrId, saveReview, loadReviewsForProduct };
