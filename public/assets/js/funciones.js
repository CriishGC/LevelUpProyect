if (typeof window.formateaCLP === 'undefined') {
  window.formateaCLP = function formateaCLP(n){ return (Number(n) || 0).toLocaleString("es-CL") + " CLP"; };
}

const _escapeHtml = (s='') => String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'","&#39;");
const escapeHtml = (typeof window.escapeHtml === 'function') ? window.escapeHtml : _escapeHtml;

function getProductPool() {
  const src = (window.productosGlobal && window.productosGlobal.length) ? window.productosGlobal
    : (window.PRODUCTOS && window.PRODUCTOS.length) ? window.PRODUCTOS
    : (window.PRODUCTOS_MOCK && window.PRODUCTOS_MOCK.length) ? window.PRODUCTOS_MOCK
    : [];
  return src.map(normalizeProduct);
}

function normalizeProduct(p) {
  if (!p || typeof p !== 'object') return {};
  const id = p.id || p.cod || p.codigo || p._id || (p.codigo_producto && String(p.codigo_producto)) || null;
  const cod = p.cod || p.codigo || p.id || id || null;
  const nombre = p.nombre || p.name || p.title || p.nombreProducto || '';
  const precio = Number(p.precio || p.price || p.valor || p.priceCLP || 0) || 0;
  const desc = p.desc || p.descripcion || p.description || p.detalle || '';
  const cat = p.cat || p.categoria || p.category || p.tipo || 'Sin categoría';
  const candidate = p.imagen || p.img || p.imagenURL || p.imagen_url || p.image || p.imageURL || (p.images && p.images[0]) || '';
  const img = (typeof candidate === 'string') ? candidate : (Array.isArray(candidate) && candidate.length ? candidate[0] : '');
  return {
    _raw: p,
    id: id,
    cod: cod,
    nombre: nombre,
    precio: precio,
    desc: desc,
    cat: cat,
    imagen: img,
    img: img
  };
}

function resolveProductImage(p) {
  if (!p) return 'https://via.placeholder.com/400x300/1f1f1f/999999?text=Sin+Imagen';
  let candidate = p.imagen || p.img || p.imagenURL || p.imagen_url || p.image || p.imageURL || p.imagenes || p.images || '';
  if (Array.isArray(candidate)) {
    candidate = candidate.length ? candidate[0] : '';
  }
  if (candidate && typeof candidate === 'object') {
    candidate = candidate.url || candidate.path || candidate.storagePath || '';
  }
  const c = (typeof candidate === 'string') ? candidate.trim() : '';
  if (!c) return 'https://via.placeholder.com/400x300/1f1f1f/999999?text=Sin+Imagen';
  if (/^(https?:)?\/\//i.test(c) || /firebasestorage\.googleapis\.com/i.test(c)) return c;
  if (/^\//.test(c)) return c;
  return `/assets/img/${c}`;
}

function renderCatalogoMockup(){
  const cont = document.getElementById("productos-lista");
  if (!cont) return;
  const pool = getProductPool();
  cont.innerHTML = pool
    .map(p => `
      <div class="col-sm-6 col-md-4 col-lg-3 mb-3">
        <div class="card bg-secondary text-light h-100 product-card">
          <img src="${resolveProductImage(p)}" class="card-img-top" alt="${p.nombre}" onerror="this.src='https://via.placeholder.com/400x300/1f1f1f/999999?text=Sin+Imagen'">
          <div class="card-body d-flex flex-column">
            <h5 class="card-title">${p.nombre}</h5>
            <span class="badge bg-primary mb-2">${p.cat}</span>
            <p class="precio fw-bold mb-2">${formateaCLP(p.precio)}</p>
            <div class="mt-auto d-grid gap-2">
              <a class="btn btn-outline-light" href="product.html?cod=${p.cod}">Ver detalle</a>
            </div>
          </div>
        </div>
      </div>
    `).join('');
}

function renderIndexCatalogoMockup() {
  const cont = document.getElementById("grid-productos");
  if (!cont) return;
  const pool2 = getProductPool();
  cont.innerHTML = pool2
    .map(p => `
      <div class="col-sm-6 col-md-4 col-lg-3 mb-3">
        <div class="card bg-secondary text-light h-100 product-card">
          <img src="${(p.imagen && (/^https?:\/\//i.test(p.imagen) ? p.imagen : 'assets/img/'+p.imagen)) || (p.img ? 'assets/img/'+p.img : 'https://via.placeholder.com/400x300/1f1f1f/999999?text=Sin+Imagen') }" class="card-img-top" alt="${p.nombre}" onerror="this.src='https://via.placeholder.com/400x300/1f1f1f/999999?text=Sin+Imagen'">
          <div class="card-body d-flex flex-column justify-content-center align-items-center">
            <span class="badge bg-primary mb-2">${p.cat}</span>
            <span class="d-block fw-bold font-orbitron">${p.nombre}</span>
            <span class="d-block">${formateaCLP(p.precio)}</span>
            <a class="btn btn-outline-light mt-2" href="assets/page/product.html?cod=${p.cod}">Ver detalle</a>
          </div>
        </div>
      </div>
    `).join('');
}

async function renderDetalleProducto() {
  const params = new URLSearchParams(window.location.search);
  const cod = params.get("cod");
  const codStr = cod ? String(cod) : '';
  let prod = null;
  try {
    const stored = localStorage.getItem('producto_visto_oferta');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && (String(parsed.cod || parsed.id || parsed.codigo) === codStr)) {
        prod = normalizeProduct(parsed);
        localStorage.removeItem('producto_visto_oferta');
      }
    }
  } catch (e) { /* noop */ }
  let poolInit = getProductPool();
  if (!prod) prod = poolInit.find(p => String(p.cod) === codStr || String(p.id) === codStr);

  if (!prod) {
    let attempts = 0;
    while (!prod && attempts < 8) {
      attempts++;
      try {
        if (window && typeof window.loadProductosGlobalFromFirestore === 'function') {
          await window.loadProductosGlobalFromFirestore().catch(() => {});
        }
        const pool = window.productosGlobal || window.PRODUCTOS_MOCK || window.PRODUCTOS || [];
        prod = pool.find(p => ((p.cod && String(p.cod) === String(cod)) || (p.codigo && String(p.codigo) === String(cod)) || (p.id && String(p.id) === String(cod))));
        if (prod) break;
      } catch (e) {
        console.warn('Error buscando producto en Firestore (intento ' + attempts + '):', e);
      }
      await new Promise(r => setTimeout(r, 200));
    }
  }
  if (!prod && typeof window.getOfertasCargadas === 'function') {
    try {
      const offers = window.getOfertasCargadas() || [];
      prod = offers.find(p => String(p.cod) === codStr || String(p.id) === codStr || String(p.codigo) === codStr);
    } catch (e) { /* noop */ }
  }
  if (!prod && typeof window.getProductosFiltradosActualesOfertas === 'function') {
    try {
      const offers2 = window.getProductosFiltradosActualesOfertas() || [];
      prod = offers2.find(p => String(p.cod) === codStr || String(p.id) === codStr || String(p.codigo) === codStr);
    } catch (e) { /* noop */ }
  }

  if (!prod) return;

  const img = document.getElementById("main-img");
  if (img) {
    img.src = resolveProductImage(prod);
    img.alt = prod.nombre || '';
  }
  const title = document.getElementById("product-title");
  if (title) title.textContent = prod.nombre;
  const price = document.getElementById("product-price");
  if (price) price.textContent = formateaCLP(prod.precio);
  const desc = document.getElementById("product-desc");
  if (desc) desc.textContent = prod.desc;
  const bread = document.getElementById("breadcrumb-title");
  if (bread) bread.textContent = prod.nombre;

  try {
    await ensureFirebaseInitialized();
  } catch (e) { /* ignore init errors; fallback to localStorage below */ }
  await loadAndRenderReviews(prod);

  let poolRel = getProductPool();
  let relacionados = poolRel.filter(p => p.cat === prod.cat && p.cod !== prod.cod);
  if (relacionados.length < 4) {
    const poolAll = getProductPool();
    relacionados = [
      ...relacionados,
      ...poolAll.filter(p => p.cod !== prod.cod && !relacionados.includes(p))
    ].slice(0, 4);
  }
  const related = document.getElementById("related-products");
  if (related) {
    related.innerHTML = relacionados.map(p => {
      const src = resolveProductImage(p);
      return `
      <div class="col-sm-6 col-lg-3">
        <a href="product.html?cod=${encodeURIComponent(p.cod || p.id || '')}" class="text-decoration-none">
          <div class="card bg-secondary text-light h-100 product-card border border-primary">
            <img src="${src}" class="card-img-top" alt="${(p.nombre||'')}">
            <div class="card-body text-center">
              <span class="d-block fw-bold font-orbitron">${p.nombre}</span>
              <span class="d-block">${formateaCLP(p.precio)}</span>
            </div>
          </div>
        </a>
      </div>
    `}).join('');
  }

  const btnAdd = document.getElementById('add-to-cart');
  if (btnAdd) {
    btnAdd.onclick = function () {
      const qtyEl = document.getElementById('qty');
      let qty = qtyEl ? (Number(qtyEl.value) || 1) : 1;
      if (window && typeof window.agregarAlCarrito === 'function') {
        try {
          const idVal = prod.id || prod.cod || prod.codigo || prod.codigoProducto || prod._id || prod.ID || prod.codigo_producto || null;
          const nombreVal = prod.nombre || prod.name || prod.title || '';
          const precioVal = Number(prod.precio || prod.price || prod.valor || 0) || 0;
          const imagenVal = prod.imagen || prod.img || prod.imagenURL || prod.imagen_url || prod.image || '';

          if (!idVal) {
            console.warn('agregarAlCarrito desde detalle: producto sin id detectado, objeto:', prod);
          }

          window.agregarAlCarrito({ id: idVal || nombreVal, nombre: nombreVal, precio: precioVal, imagen: imagenVal }, qty);
        } catch (e) {
          console.warn('Error agregando al carrito desde detalle:', e);
        }
      } else {
        try {
          if (!document.querySelector('script[src="/assets/js/carrito.js"]')) {
            const s = document.createElement('script');
            s.src = '/assets/js/carrito.js';
            s.async = true;
            s.onload = () => {
              try {
                if (window && typeof window.agregarAlCarrito === 'function') {
                  window.agregarAlCarrito({ id: prod.cod, nombre: prod.nombre, precio: prod.precio, imagen: prod.img }, qty);
                }
              } catch (e) { console.warn('Error agregando al carrito tras cargar script:', e); }
            };
            s.onerror = () => {
              if (typeof toast === 'function') toast('No se pudo agregar al carrito (no se pudo cargar el script).');
              else alert('No se pudo agregar al carrito (no se pudo cargar el script).');
            };
            document.head.appendChild(s);
          } else {
            const attempts = 0;
            const retry = (n) => {
              if (window && typeof window.agregarAlCarrito === 'function') {
                window.agregarAlCarrito({ id: prod.cod, nombre: prod.nombre, precio: prod.precio, imagen: prod.img }, qty);
                return;
              }
              if (n < 10) setTimeout(() => retry(n+1), 150);
              else {
                if (typeof toast === 'function') toast('No se pudo agregar al carrito (script no disponible).');
                else alert('No se pudo agregar al carrito (script no disponible).');
              }
            };
            retry(0);
          }
        } catch (e) {
          if (typeof toast === 'function') toast('No se pudo agregar al carrito (error).');
          else alert('No se pudo agregar al carrito (error).');
        }
      }
    };
  }
}

function ensureFirebaseInitialized() {
  return new Promise((resolve, reject) => {
    try {
      if (!(window.firebase && typeof firebase !== 'undefined')) {
        return reject(new Error('Firebase SDK not available'));
      }
      try {
        if (!firebase.apps || !firebase.apps.length) {
          const firebaseConfig = {
            apiKey: "AIzaSyCbVcEwCAFPJcvDwTCJnqtnyVj4asYTHo",
            authDomain: "tiendalevelup-ccd23.firebaseapp.com",
            projectId: "tiendalevelup-ccd23",
          };
          firebase.initializeApp(firebaseConfig);
        }
      } catch (e) {
      }
      if (!firebase.firestore) return resolve();
      resolve();
    } catch (e) { reject(e); }
  });
}

async function saveReviewToFirestore(product, name, rating, comment) {
  try {
    if (!(window.firebase && typeof firebase !== 'undefined') || !firebase.firestore) throw new Error('Firestore not available');
    const db = firebase.firestore();
    const doc = {
      productCod: product.cod || product.id || product.codigo || null,
      productId: product.id || product.cod || null,
      name: name || 'Anon',
      rating: Number(rating) || 0,
      comment: comment || '',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    await db.collection('producto_reviews').add(doc);
    return true;
  } catch (e) {
    console.warn('saveReviewToFirestore failed:', e);
    return false;
  }
}

function saveReviewToLocal(product, name, rating, comment) {
  try {
    const key = 'producto_reviews_local';
    const raw = JSON.parse(localStorage.getItem(key) || '{}');
    const prodKey = String(product.cod || product.id || product.codigo || '_unknown_');
    raw[prodKey] = raw[prodKey] || [];
    raw[prodKey].push({ name: name || 'Anon', rating: Number(rating) || 0, comment: comment || '', createdAt: Date.now() });
    localStorage.setItem(key, JSON.stringify(raw));
    return true;
  } catch (e) { console.warn('saveReviewToLocal failed', e); return false; }
}

async function loadReviewsFromFirestore(product) {
  try {
    if (!(window.firebase && typeof firebase !== 'undefined') || !firebase.firestore) throw new Error('Firestore not available');
    const db = firebase.firestore();
    const codCandidates = [];
    if (product.cod) codCandidates.push(String(product.cod));
    if (product.id) codCandidates.push(String(product.id));
    if (product.codigo) codCandidates.push(String(product.codigo));
    const uniq = Array.from(new Set(codCandidates)).filter(x => x && x.length);
    if (!uniq.length) return [];

    const col = db.collection('producto_reviews');
    const resultsMap = new Map();

    for (const cand of uniq) {
      try {
        const snap = await col.where('productCod', '==', cand).orderBy('createdAt', 'desc').limit(50).get();
        snap.forEach(d => {
          if (!resultsMap.has(d.id)) resultsMap.set(d.id, Object.assign({ id: d.id }, d.data()));
        });
      } catch (e) {
      }
      try {
        const snap2 = await col.where('productId', '==', cand).orderBy('createdAt', 'desc').limit(50).get();
        snap2.forEach(d => {
          if (!resultsMap.has(d.id)) resultsMap.set(d.id, Object.assign({ id: d.id }, d.data()));
        });
      } catch (e) { /* ignore */ }
    }

    const arr = Array.from(resultsMap.values()).sort((a,b) => {
      const ta = a.createdAt && a.createdAt.toDate ? a.createdAt.toDate().getTime() : (a.createdAt || 0);
      const tb = b.createdAt && b.createdAt.toDate ? b.createdAt.toDate().getTime() : (b.createdAt || 0);
      return (tb - ta) || 0;
    }).slice(0, 50);
    return arr.map(r => ({ id: r.id, name: r.name || r.nombre || 'Anon', rating: r.rating || 0, comment: r.comment || r.comentario || r.text || '', createdAt: r.createdAt }));
  } catch (e) { console.warn('loadReviewsFromFirestore failed', e); return []; }
}

function loadReviewsFromLocal(product) {
  try {
    const key = 'producto_reviews_local';
    const raw = JSON.parse(localStorage.getItem(key) || '{}');
    const prodKey = String(product.cod || product.id || product.codigo || '_unknown_');
    return raw[prodKey] || [];
  } catch (e) { return []; }
}

function formatReviewDate(ts) {
  try {
    if (!ts) return '';
    let d;
    if (ts && typeof ts.toDate === 'function') d = ts.toDate();
    else if (typeof ts === 'number') d = new Date(ts);
    else if (typeof ts === 'string' && !isNaN(Date.parse(ts))) d = new Date(ts);
    else return '';
    return d.toLocaleString('es-CL', { year: 'numeric', month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch (e) { return ''; }
}

async function loadAndRenderReviews(product) {
  const container = document.getElementById('reviews-product');
  const containerBelow = document.getElementById('reviews-below-related');
  if (!container && !containerBelow) return;
  let reviews = [];
  try {
    await ensureFirebaseInitialized();
    reviews = await loadReviewsFromFirestore(product);
  } catch (e) {
    reviews = [];
  }
  const local = loadReviewsFromLocal(product) || [];
  reviews = [...local.map(r => (Object.assign({local:true}, r))), ...reviews];

  const html = (reviews.length)
    ? reviews.map(r => `
      <div class="mb-2">
        <div class="d-flex justify-content-between align-items-center">
          <div><strong>${escapeHtml(r.name || 'Anon')}</strong>
            <div class="small text-secondary">${formatReviewDate(r.createdAt)}</div>
          </div>
          <small class="text-secondary">${r.rating || 0} ★ ${r.local ? '(local)' : ''}</small>
        </div>
        <div class="text-secondary small mt-1">${escapeHtml(r.comment || '')}</div>
      </div>
    `).join('')
    : '<p class="text-secondary">Aún no hay reseñas. Sé el primero en comentar.</p>';

  if (container) container.innerHTML = html;
  if (containerBelow) containerBelow.innerHTML = `
    <h4 class="font-orbitron text-white mb-3">Reseñas</h4>
    ${html}
  `;
}

document.addEventListener('DOMContentLoaded', () => {
  try {
    const btn = document.getElementById('btn-review');
    if (!btn) return;
    btn.addEventListener('click', async () => {
      const nameEl = document.getElementById('rv-nombre-product');
      const ratingEl = document.getElementById('rv-rating-product');
      const commentEl = document.getElementById('rv-com-product');
      const name = nameEl ? nameEl.value.trim() : 'Anon';
      const rating = ratingEl ? Number(ratingEl.value) : 5;
      const comment = commentEl ? commentEl.value.trim() : '';
      const titleEl = document.getElementById('product-title');
      const title = titleEl ? titleEl.textContent : '';
      const params = new URLSearchParams(window.location.search);
      const cod = params.get('cod');
      const product = { cod };
      let saved = false;
      try {
        await ensureFirebaseInitialized();
        if (cod) saved = await saveReviewToFirestore(product, name, rating, comment);
      } catch (e) { saved = false; }
      if (!saved) {
        saveReviewToLocal(product, name, rating, comment);
      }
      if (nameEl) nameEl.value = '';
      if (ratingEl) ratingEl.value = '5';
      if (commentEl) commentEl.value = '';
      await loadAndRenderReviews(product);
      if (typeof toast === 'function') toast('Reseña publicada');
      else alert('Reseña publicada');
    });
  } catch (e) { /* noop */ }
});

document.addEventListener("DOMContentLoaded", function() {
  renderCatalogoMockup();
  renderIndexCatalogoMockup();
  renderDetalleProducto();
});

function tryActualizarBadgeCarrito(maxAttempts = 12, intervalMs = 200) {
  if (typeof window.actualizarBadgeCarrito === 'function') {
    try { window.actualizarBadgeCarrito(); } catch (e) { /* noop */ }
    return;
  }
  let attempts = 0;
  const tryFn = () => {
    if (typeof window.actualizarBadgeCarrito === 'function') {
      try { window.actualizarBadgeCarrito(); } catch (e) { /* noop */ }
      return;
    }
    attempts++;
    if (attempts < maxAttempts) setTimeout(tryFn, intervalMs);
  };
  tryFn();
}

try {
  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => tryActualizarBadgeCarrito());
  }
} catch (e) { /* noop */ }