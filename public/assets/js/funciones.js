if (typeof window.formateaCLP === 'undefined') {
  window.formateaCLP = function formateaCLP(n){ return (Number(n) || 0).toLocaleString("es-CL") + " CLP"; };
}

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
  let poolInit = getProductPool();
  let prod = poolInit.find(p => p.cod === cod);

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