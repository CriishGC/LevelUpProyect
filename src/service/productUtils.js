function formateaCLP(n){ return (Number(n) || 0).toLocaleString("es-CL") + " CLP"; }

function escapeHtml(s=''){
  return String(s)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'","&#39;");
}

function normalizeProduct(p){
  if (!p || typeof p !== 'object') return {};
  const id = p.id || p.cod || p.codigo || p._id || (p.codigo_producto && String(p.codigo_producto)) || null;
  const cod = p.cod || p.codigo || p.id || id || null;
  const nombre = p.nombre || p.name || p.title || p.nombreProducto || '';
  const precio = Number(p.precio || p.price || p.valor || p.priceCLP || 0) || 0;
  const desc = p.desc || p.descripcion || p.description || p.detalle || '';
  const cat = p.cat || p.categoria || p.category || p.tipo || 'Sin categoría';
  const candidate = p.imagen || p.img || p.imagenURL || p.imagen_url || p.image || p.imageURL || (p.images && p.images[0]) || '';
  const img = (typeof candidate === 'string') ? candidate : (Array.isArray(candidate) && candidate.length ? candidate[0] : '');
  return { _raw: p, id, cod, nombre, precio, desc, cat, imagen: img, img };
}

function resolveProductImage(p) {
  if (!p) return 'https://via.placeholder.com/400x300/1f1f1f/999999?text=Sin+Imagen';
  let candidate = p.imagen || p.img || p.imagenURL || p.imagen_url || p.image || p.imageURL || p.imagenes || p.images || '';
  if (Array.isArray(candidate)) candidate = candidate.length ? candidate[0] : '';
  if (candidate && typeof candidate === 'object') candidate = candidate.url || candidate.path || candidate.storagePath || '';
  const c = (typeof candidate === 'string') ? candidate.trim() : '';
  if (!c) return 'https://via.placeholder.com/400x300/1f1f1f/999999?text=Sin+Imagen';
  if (/^(https?:)?\/\//i.test(c) || /firebasestorage\.googleapis\.com/i.test(c)) return c;
  if (/^\//.test(c)) return c;
  return `/assets/img/${c}`;
}

function obtenerCategoriasUnicas(productos) {
  const set = new Set();
  (productos || []).forEach(p => {
    const c = p.categoria || p.cat || 'Sin categoría';
    if (c) set.add(c);
  });
  return Array.from(set).sort((a,b)=>a.localeCompare(b,'es'));
}

function getProductPool(){
  const src = (window.productosGlobal && window.productosGlobal.length) ? window.productosGlobal
    : (window.PRODUCTOS && window.PRODUCTOS.length) ? window.PRODUCTOS
    : (window.PRODUCTOS_MOCK && window.PRODUCTOS_MOCK.length) ? window.PRODUCTOS_MOCK
    : [];
  return src.map(normalizeProduct);
}

export { formateaCLP, escapeHtml, normalizeProduct, resolveProductImage, obtenerCategoriasUnicas, getProductPool };
