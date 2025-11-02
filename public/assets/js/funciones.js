
function formateaCLP(n){ return n.toLocaleString("es-CL")+" CLP"; }

function getProductPool() {
  const src = (window.productosGlobal && window.productosGlobal.length) ? window.productosGlobal
    : (window.PRODUCTOS && window.PRODUCTOS.length) ? window.PRODUCTOS
    : (window.PRODUCTOS_MOCK && window.PRODUCTOS_MOCK.length) ? window.PRODUCTOS_MOCK
    : [];
  // Normalizar cada producto para tener campos previsibles
  return src.map(normalizeProduct);
}

// Normaliza distintos esquemas de producto a un shape común
function normalizeProduct(p) {
  if (!p || typeof p !== 'object') return {};
  const id = p.id || p.cod || p.codigo || p._id || (p.codigo_producto && String(p.codigo_producto)) || null;
  const cod = p.cod || p.codigo || p.id || id || null;
  const nombre = p.nombre || p.name || p.title || p.nombreProducto || '';
  const precio = Number(p.precio || p.price || p.valor || p.priceCLP || 0) || 0;
  const desc = p.desc || p.descripcion || p.description || p.detalle || '';
  const cat = p.cat || p.categoria || p.category || p.tipo || 'Sin categoría';
  // imagen puede venir en varios campos
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

// Resolver ruta de imagen para un producto (acepta URL absoluta o nombre de archivo)
function resolveProductImage(p) {
  if (!p) return 'https://via.placeholder.com/400x300/1f1f1f/999999?text=Sin+Imagen';
  let candidate = p.imagen || p.img || p.imagenURL || p.imagen_url || p.image || p.imageURL || p.imagenes || p.images || '';
  // si es array, tomar primero
  if (Array.isArray(candidate)) {
    candidate = candidate.length ? candidate[0] : '';
  }
  // si viene como objeto con campo url / path
  if (candidate && typeof candidate === 'object') {
    candidate = candidate.url || candidate.path || candidate.storagePath || '';
  }
  const c = (typeof candidate === 'string') ? candidate.trim() : '';
  if (!c) return 'https://via.placeholder.com/400x300/1f1f1f/999999?text=Sin+Imagen';
  // si ya es URL absoluta (http, https, data) o Firebase storage public URL
  if (/^(https?:)?\/\//i.test(c) || /firebasestorage\.googleapis\.com/i.test(c)) return c;
  // si empieza con slash, tratar como ruta absoluta en el servidor
  if (/^\//.test(c)) return c;
  // otherwise, assume it's a filename stored under /assets/img/ and return an absolute path so it's valid from any page
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

// Muestra catálogo en index.html (inicio)
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

// Muestra detalle de producto en product.html
async function renderDetalleProducto() {
  const params = new URLSearchParams(window.location.search);
  const cod = params.get("cod");
  let poolInit = getProductPool();
  let prod = poolInit.find(p => p.cod === cod);

  // Si no está en los mocks, intentar cargar desde Firestore (vía carrito.js helper)
  if (!prod) {
    // Intentar varias veces por si carrito.js aún se está inyectando
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
      // esperar un poco antes del siguiente intento
      await new Promise(r => setTimeout(r, 200));
    }
  }
  if (!prod) return;

  // Rellena los elementos visuales
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

  // Productos relacionados (solo visual)
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

  // Añadir handler para el botón "Añadir al carrito" en la página de detalle
  const btnAdd = document.getElementById('add-to-cart');
  if (btnAdd) {
    btnAdd.onclick = function () {
      const qtyEl = document.getElementById('qty');
      let qty = qtyEl ? (Number(qtyEl.value) || 1) : 1;
      // Llamamos agregarAlCarrito qty veces (agregarAlCarrito no acepta qty directo)
      if (window && typeof window.agregarAlCarrito === 'function') {
        try {
          // Normalizar campos del producto (Firestore puede usar id / codigo / cod y imagen/imagen_url/img)
          const idVal = prod.id || prod.cod || prod.codigo || prod.codigoProducto || prod._id || prod.ID || prod.codigo_producto || null;
          const nombreVal = prod.nombre || prod.name || prod.title || '';
          const precioVal = Number(prod.precio || prod.price || prod.valor || 0) || 0;
          const imagenVal = prod.imagen || prod.img || prod.imagenURL || prod.imagen_url || prod.image || '';

          if (!idVal) {
            console.warn('agregarAlCarrito desde detalle: producto sin id detectado, objeto:', prod);
            // Intentar usar nombre como id de último recurso
          }

          window.agregarAlCarrito({ id: idVal || nombreVal, nombre: nombreVal, precio: precioVal, imagen: imagenVal }, qty);
        } catch (e) {
          console.warn('Error agregando al carrito desde detalle:', e);
        }
      } else {
        // Si el script no está cargado, inyectarlo dinámicamente y luego intentar la operación
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
            // Si ya había tag <script> pero la función no existe, esperar un poco y reintentar
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

// Inicialización: muestra catálogo y producto según la página
document.addEventListener("DOMContentLoaded", function() {
  renderCatalogoMockup();        // catalogo.html
  renderIndexCatalogoMockup();   // index.html
  renderDetalleProducto();       // product.html
});