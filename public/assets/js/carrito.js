// carrito.js (adaptado para obtener información de productos desde Firestore - Firebase v8 compat)
// Asegúrate de incluir en tu HTML los scripts CDN v8 (ver arriba) antes de este script.
//
// Configuración y uso:
//  - Incluye los <script> de Firebase v8 antes de este archivo.
//  - Este archivo inicializa Firebase (si no está inicializado) y usa la colección 'productos'.
//  - Conserva estado del carrito en localStorage (clave: 'carrito') y sincroniza metadata con Firestore.
//
// Reemplaza tu carrito.js por este archivo o pégalo en tu proyecto.

'use strict';

// --- CONFIGURACIÓN FIREBASE (usa tu config completa) ---
const firebaseConfig = {
  apiKey: "AIzaSyCbVcEwCAFPJcvDwTCJnqtnyVJc4asYTHo",
  authDomain: "tiendalevelup-ccd23.firebaseapp.com",
  projectId: "tiendalevelup-ccd23",
  storageBucket: "tiendalevelup-ccd23.appspot.com",
  messagingSenderId: "788122901795",
  appId: "1:788122901795:web:1feabe6474cd2b44ef4096",
  measurementId: "G-QHQ3RM5FD8"
};

// --- Claves y estado ---
const STORAGE_KEY = 'carrito';           // guarda [{ id, qty }, ...]
const META_KEY = STORAGE_KEY + '_meta';  // guarda { id: { nombre, precio, imagen, stock } }
let carrito = [];
let carritoMeta = {};
let cuponAplicado = localStorage.getItem(STORAGE_KEY + '_cupon') || '';
let firebaseEnabled = false;
let db = null;
const FIRESTORE_COLLECTION = 'productos'; // nombre de la colección en Firestore

// ----------------- Helpers -----------------
function formateaCLP(n) {
  n = Number(n) || 0;
  return `$ ${n.toLocaleString('es-CL')}`;
}
function escapeHtml(s = '') {
  return String(s)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#39;');
}
function isURL(s) {
  return typeof s === 'string' && /^https?:\/\//i.test(s);
}
function toast(mensaje) {
  const n = document.createElement('div');
  n.style.cssText = `
    position: fixed; top: 100px; right: 20px;
    background: #28a745; color: #fff; padding: 10px 14px;
    border-radius: 6px; z-index: 20000; box-shadow: 0 6px 18px rgba(0,0,0,.3);
    font-weight: 600;
  `;
  n.textContent = mensaje;
  document.body.appendChild(n);
  setTimeout(() => n.remove(), 2200);
}
function debugLog(...args) {
  // Descomenta si quieres ver logs
  // console.debug('[carrito.js]', ...args);
}

// ----------------- Meta / Persistencia -----------------
function cargarMeta() {
  try {
    const raw = localStorage.getItem(META_KEY);
    carritoMeta = raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.warn('Error leyendo carrito_meta:', e);
    carritoMeta = {};
  }
}
function persistirMeta() {
  try {
    localStorage.setItem(META_KEY, JSON.stringify(carritoMeta));
  } catch (e) {
    console.warn('Error guardando carrito_meta:', e);
  }
}

// ----------------- Carrito: carga, persistencia y migración -----------------
function cargarCarrito() {
  cargarMeta();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];

    // Detectar formato antiguo: objetos con 'precio' o 'nombre'
    const esFormatoAntiguo = Array.isArray(parsed) && parsed.length > 0 &&
      (parsed[0].precio !== undefined || parsed[0].nombre !== undefined);

    if (esFormatoAntiguo) {
      // Migrar agrupando por id/cod y construir meta a partir de esos objetos
      const mapa = new Map();
      parsed.forEach(p => {
        const id = p.id || p.cod || p.codigo || null;
        if (!id) return;
        mapa.set(String(id), (mapa.get(String(id)) || 0) + 1);
        // Guardar meta (último valor prevalece)
        carritoMeta[String(id)] = {
          nombre: p.nombre || carritoMeta[String(id)]?.nombre || String(id),
          precio: Number(p.precio) || carritoMeta[String(id)]?.precio || 0,
          imagen: p.imagen || p.img || carritoMeta[String(id)]?.imagen || '',
          stock: carritoMeta[String(id)]?.stock || null
        };
      });
      const migrado = Array.from(mapa.entries()).map(([id, qty]) => ({ id, qty }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrado));
      persistirMeta();
      carrito = migrado;
      return carrito;
    }

    // Si ya está en el formato nuevo
    if (Array.isArray(parsed)) {
      carrito = parsed.map(i => ({ id: String(i.id), qty: Math.max(1, Number(i.qty) || 1) }));
      return carrito;
    }

    carrito = [];
    return carrito;
  } catch (e) {
    console.warn('Error leyendo carrito desde localStorage:', e);
    carrito = [];
    return carrito;
  }
}
function persistirCarrito() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(carrito));
  } catch (e) {
    console.warn('Error guardando carrito:', e);
  }
}

// ----------------- Firebase: inicialización y sincronización -----------------
function initFirebaseIfAvailable() {
  // Requiere que el SDK compat (window.firebase) esté cargado en la página antes de este script.
  if (window.firebase && firebase.initializeApp) {
    try {
      // Inicializar sólo si no está ya inicializado
      if (!firebase.apps || !firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      db = firebase.firestore();
      firebaseEnabled = true;
      debugLog('Firebase inicializado (compat).');
    } catch (e) {
      console.warn('No se pudo inicializar Firebase:', e);
      firebaseEnabled = false;
      db = null;
    }
  } else {
    debugLog('Firebase SDK no encontrado en window.firebase -> no se conectará a Firestore.');
    firebaseEnabled = false;
    db = null;
  }
}

// intenta obtener documentos de Firestore por ids (intenta doc(id) y luego consulta por campos cod/codigo)
async function fetchProductsFromFirestoreByIds(ids = []) {
  if (!firebaseEnabled || !db) return {};
  const out = {};
  const uniqueIds = Array.from(new Set(ids)).filter(Boolean).map(String);
  if (!uniqueIds.length) return out;

  const promises = uniqueIds.map(async id => {
    try {
      // 1) Intentar como document id
      const docRef = db.collection(FIRESTORE_COLLECTION).doc(id);
      const docSnap = await docRef.get();
      if (docSnap && docSnap.exists) {
        out[String(id)] = { id: docSnap.id, ...docSnap.data() };
        return;
      }
      // 2) Buscar por campo 'cod'
      let q = await db.collection(FIRESTORE_COLLECTION).where('cod', '==', id).limit(1).get();
      if (!q.empty && q.docs.length) {
        const d = q.docs[0];
        out[String(id)] = { id: d.id, ...d.data() };
        return;
      }
      // 3) Buscar por campo 'codigo'
      q = await db.collection(FIRESTORE_COLLECTION).where('codigo', '==', id).limit(1).get();
      if (!q.empty && q.docs.length) {
        const d = q.docs[0];
        out[String(id)] = { id: d.id, ...d.data() };
        return;
      }
      debugLog('No encontrado en Firestore id:', id);
      return;
    } catch (e) {
      console.warn('Error consultando Firestore para id', id, e);
      return;
    }
  });

  await Promise.all(promises);
  return out;
}

// Sincroniza metadata del carrito con Firestore: actualiza carritoMeta con precio/imagen/stock/nombre
async function enrichCarritoFromFirestore() {
  if (!firebaseEnabled || !db) return;
  cargarCarrito();
  cargarMeta();
  const ids = carrito.map(i => i.id);
  if (!ids.length) return;
  const mapa = await fetchProductsFromFirestoreByIds(ids);
  let changed = false;

  Object.keys(mapa).forEach(id => {
    const d = mapa[id];
    if (!d) return;
    // Campos posibles: nombre, precio, imagen, img, cod, stock
    const nombre = d.nombre || d.name || d.title || d.nombreProducto || carritoMeta[id]?.nombre || d.cod || id;
    const precio = Number(d.precio || d.price || 0) || 0;
    const imagen = d.imagen || d.img || d.imagenURL || d.imagen_url || '';
    const stock = (d.stock !== undefined) ? (Number(d.stock) || 0) : (d.cantidad !== undefined ? Number(d.cantidad) : null);

    carritoMeta[id] = {
      nombre,
      precio: (precio || carritoMeta[id]?.precio || 0),
      imagen: imagen || carritoMeta[id]?.imagen || '',
      stock: (stock !== null && !Number.isNaN(stock)) ? stock : carritoMeta[id]?.stock
    };
    changed = true;
  });

  if (changed) {
    persistirMeta();
    actualizarCarritoUI();
    renderCarrito();
  }
}

// Cargar todos los productos desde Firestore (guarda en window.productosGlobal)
async function loadProductosGlobalFromFirestore() {
  if (!firebaseEnabled || !db) return [];
  try {
    const snap = await db.collection(FIRESTORE_COLLECTION).get();
    const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    window.productosGlobal = docs;
    return docs;
  } catch (e) {
    console.warn('Error cargando productos desde Firestore:', e);
    return [];
  }
}

// ----------------- Operaciones del carrito -----------------
function agregarAlCarrito(prodOrId) {
  cargarCarrito();
  cargarMeta();

  let id, nombre, precio, imagen, stock;
  if (typeof prodOrId === 'string') {
    id = prodOrId;
  } else if (typeof prodOrId === 'object' && prodOrId !== null) {
    id = prodOrId.id || prodOrId.cod || prodOrId.codigo;
    nombre = prodOrId.nombre || prodOrId.name || prodOrId.title;
    precio = Number(prodOrId.precio || prodOrId.price || 0);
    imagen = prodOrId.imagen || prodOrId.img || prodOrId.imagenURL || '';
    stock = prodOrId.stock !== undefined ? Number(prodOrId.stock) : null;

    if (id) {
      carritoMeta[String(id)] = {
        nombre: nombre || carritoMeta[String(id)]?.nombre || String(id),
        precio: precio || carritoMeta[String(id)]?.precio || 0,
        imagen: imagen || carritoMeta[String(id)]?.imagen || '',
        stock: (stock !== null && !Number.isNaN(stock)) ? stock : carritoMeta[String(id)]?.stock
      };
      persistirMeta();
    }
  }
  if (!id) {
    console.warn('agregarAlCarrito: producto sin id/cod:', prodOrId);
    return;
  }

  const idx = carrito.findIndex(i => String(i.id) === String(id));
  if (idx >= 0) {
    // controlar stock si está presente
    const meta = carritoMeta[String(id)] || {};
    const stockAvailable = meta.stock;
    const newQty = Number(carrito[idx].qty || 0) + 1;
    if (stockAvailable !== undefined && stockAvailable !== null && newQty > stockAvailable) {
      toast('No hay suficiente stock disponible.');
      return;
    }
    carrito[idx].qty = newQty;
  } else {
    carrito.push({ id: String(id), qty: 1 });
  }

  persistirCarrito();
  actualizarCarritoUI();
  const nameForToast = nombre || (carritoMeta[String(id)] && carritoMeta[String(id)].nombre) || id;
  toast(`"${nameForToast}" agregado al carrito`);

  // Si Firebase está disponible, intentar enriquecer metadata desde Firestore
  if (firebaseEnabled) enrichCarritoFromFirestore().catch(e => console.warn('enrich error', e));
}

function cambiarCantidadCarrito(id, nuevaQty) {
  cargarCarrito();
  nuevaQty = Number(nuevaQty) || 0;
  cargarMeta();
  const meta = carritoMeta[String(id)] || {};
  if (meta.stock !== undefined && meta.stock !== null && nuevaQty > meta.stock) {
    toast('No hay suficiente stock para esa cantidad.');
    nuevaQty = meta.stock;
  }
  carrito = carrito.map(i => i.id === id ? { ...i, qty: nuevaQty } : i).filter(i => i.qty > 0);
  persistirCarrito();
  actualizarCarritoUI();
  renderCarrito();
}

function eliminarItemCarrito(id) {
  cargarCarrito();
  carrito = carrito.filter(i => String(i.id) !== String(id));
  persistirCarrito();
  actualizarCarritoUI();
  renderCarrito();
}

// ----------------- Cálculo y render -----------------
function calcularTotales() {
  cargarCarrito();
  cargarMeta();

  const fuentes = (window.productosGlobal && window.productosGlobal.length) ? window.productosGlobal
                : (window.PRODUCTOS_MOCK && window.PRODUCTOS_MOCK.length) ? window.PRODUCTOS_MOCK
                : (window.PRODUCTOS && window.PRODUCTOS.length) ? window.PRODUCTOS
                : [];

  const detalles = carrito.map(i => {
    const p = fuentes.find(pp => (String(pp.id) === String(i.id) || String(pp.cod) === String(i.id))) || null;
    const meta = carritoMeta[String(i.id)] || {};
    const precio = p ? Number(p.precio || p.price || 0) : Number(meta.precio || 0);
    const subtotal = precio * (Number(i.qty) || 0);
    const stock = (p && (p.stock !== undefined)) ? Number(p.stock) : (meta.stock !== undefined ? Number(meta.stock) : null);
    return { id: i.id, qty: Number(i.qty) || 0, producto: p, precio, subtotal, meta, stock };
  });

  const total = detalles.reduce((s, d) => s + d.subtotal, 0);
  let descuento = 0;
  if (cuponAplicado === 'DESCUENTO10') descuento = Math.round(total * 0.10);
  const totalConDescuento = Math.max(0, total - descuento);
  return { detalles, total, descuento, totalConDescuento };
}

function actualizarCarritoUI() {
  cargarCarrito();
  cargarMeta();
  const totalItems = carrito.reduce((s, i) => s + (Number(i.qty) || 0), 0);

  let totalMoney = 0;
  const fuentes = (window.productosGlobal && window.productosGlobal.length) ? window.productosGlobal
                : (window.PRODUCTOS_MOCK && window.PRODUCTOS_MOCK.length) ? window.PRODUCTOS_MOCK
                : (window.PRODUCTOS && window.PRODUCTOS.length) ? window.PRODUCTOS
                : [];

  carrito.forEach(it => {
    const p = fuentes.find(pp => (String(pp.id) === String(it.id) || String(pp.cod) === String(it.id)));
    if (p) totalMoney += (Number(p.precio || p.price) || 0) * (Number(it.qty) || 0);
    else if (carritoMeta[String(it.id)] && carritoMeta[String(it.id)].precio) {
      totalMoney += (Number(carritoMeta[String(it.id)].precio) || 0) * (Number(it.qty) || 0);
    }
  });

  const badge = document.querySelector('#badge-carrito');
  if (badge) {
    badge.textContent = totalItems ? String(totalItems) : '';
    badge.title = `Total: ${formateaCLP(totalMoney)}`;
  }
  const cartCountAlt = document.querySelector('#cart-count');
  if (cartCountAlt) cartCountAlt.textContent = totalItems ? String(totalItems) : '';
}

// Renderiza la UI del carrito en #carrito-lista
function renderCarrito() {
  const cont = document.getElementById('carrito-lista');
  const totalEl = document.getElementById('total');
  const descuentoEl = document.getElementById('descuento');
  const duocValidacionEl = document.getElementById('duoc-validacion');

  if (!cont) return;
  const { detalles, total, descuento, totalConDescuento } = calcularTotales();

  if (!detalles.length) {
    cont.innerHTML = `<div class="alert alert-secondary">Tu carrito está vacío. Agrega productos desde el catálogo.</div>`;
    if (totalEl) totalEl.textContent = '$ 0';
    if (descuentoEl) descuentoEl.textContent = '';
    if (duocValidacionEl) duocValidacionEl.innerHTML = '';
    return;
  }

  cont.innerHTML = detalles.map(d => {
    const p = d.producto;
    const meta = d.meta || {};
    const nombre = p ? (p.nombre || p.name || p.title) : (meta.nombre || d.id);
    const precioStr = formateaCLP(d.precio);

    // Imagen: prioriza fuente global (URL o nombre de archivo), luego metadata, luego placeholder
    let imgPath = '';
    if (p) {
      const candidate = p.imagen || p.img || p.imagenURL || p.imagen_url || '';
      imgPath = candidate ? (isURL(candidate) ? candidate : `../img/${candidate}`) : '';
    }
    if (!imgPath && meta.imagen) imgPath = isURL(meta.imagen) ? meta.imagen : `../img/${meta.imagen}`;
    if (!imgPath) imgPath = 'https://via.placeholder.com/200x150';

    // stock y control de botones
    const stock = (d.stock !== null && d.stock !== undefined) ? d.stock : (meta.stock !== undefined ? meta.stock : null);
    const canIncrease = (stock === null) ? true : (d.qty < stock);

    const stockBadge = (stock === null) ? '' : `<div class="text-muted small">Stock: ${stock}</div>`;

    return `
      <div class="card mb-3 bg-dark text-light">
        <div class="row g-0 align-items-center">
          <div class="col-3">
            <img src="${imgPath}" class="img-fluid rounded-start" alt="${escapeHtml(nombre)}"
                 onerror="this.src='https://via.placeholder.com/200x150'">
          </div>
          <div class="col-5">
            <div class="card-body">
              <h5 class="card-title mb-1">${escapeHtml(nombre)}</h5>
              <p class="mb-1">${precioStr} x ${d.qty}</p>
              <p class="fw-bold">Subtotal: ${formateaCLP(d.subtotal)}</p>
              ${stockBadge}
            </div>
          </div>
          <div class="col-4 text-end pe-3">
            <div class="d-flex flex-column align-items-end">
              <div class="btn-group mb-2" role="group">
                <button class="btn btn-sm btn-outline-light" onclick="cambiarCantidadCarrito('${d.id}', ${Math.max(0, d.qty - 1)})">-</button>
                <input class="form-control form-control-sm text-center" style="width:60px; display:inline-block;" type="number" min="1" value="${d.qty}" onchange="cambiarCantidadCarrito('${d.id}', this.value)">
                <button class="btn btn-sm btn-outline-light" ${canIncrease ? '' : 'disabled'} onclick="cambiarCantidadCarrito('${d.id}', ${d.qty + 1})">+</button>
              </div>
              <button class="btn btn-sm btn-danger" onclick="eliminarItemCarrito('${d.id}')">Eliminar</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  if (totalEl) totalEl.textContent = formateaCLP(totalConDescuento);
  if (descuentoEl) {
    descuentoEl.textContent = descuento > 0 ? `Descuento: -${formateaCLP(descuento)} (Cupón: ${cuponAplicado})` : '';
  }
  if (duocValidacionEl) duocValidacionEl.innerHTML = '';
}

// ----------------- Cupones y checkout -----------------
function aplicarCupon() {
  const input = document.getElementById('input-cupon');
  if (!input) return;
  const codigo = (input.value || '').trim().toUpperCase();
  if (!codigo) return toast('Ingrese un cupón.');
  if (codigo === 'DESCUENTO10') {
    cuponAplicado = codigo;
    localStorage.setItem(STORAGE_KEY + '_cupon', cuponAplicado);
    toast('Cupón aplicado: 10% de descuento');
  } else {
    cuponAplicado = '';
    localStorage.removeItem(STORAGE_KEY + '_cupon');
    toast('Cupón no válido');
  }
  renderCarrito();
}

function checkout() {
  cargarCarrito();
  if (!carrito || carrito.length === 0) {
    alert('Tu carrito está vacío.');
    return;
  }
  const { totalConDescuento } = calcularTotales();
  if (!confirm(`Total a pagar: ${formateaCLP(totalConDescuento)}\nProceder al pago (simulado)?`)) return;
  carrito = [];
  persistirCarrito();
  localStorage.removeItem(STORAGE_KEY + '_cupon');
  cuponAplicado = '';
  carritoMeta = {};
  persistirMeta();
  actualizarCarritoUI();
  renderCarrito();
  alert('Pago simulado exitoso. Gracias por tu compra.');
}

// ----------------- Inicialización -----------------
document.addEventListener('DOMContentLoaded', async () => {
  cargarCarrito();
  cargarMeta();
  cuponAplicado = localStorage.getItem(STORAGE_KEY + '_cupon') || '';

  // Inicializar Firebase si el SDK compat está presente
  initFirebaseIfAvailable();

  // Si Firebase está activo, intentar enriquecer la metadata del carrito (precios, imagenes, stock)
  if (firebaseEnabled) {
    try {
      await loadProductosGlobalFromFirestore().catch(() => {});
      await enrichCarritoFromFirestore();
    } catch (e) {
      console.warn('Error enriqueciendo carrito desde Firestore:', e);
    }
  }

  // Listener de botón cupón
  const btnCupon = document.getElementById('btn-aplicar-cupon');
  if (btnCupon) btnCupon.addEventListener('click', aplicarCupon);

  actualizarCarritoUI();

  // Renderizar con reintentos si productosGlobal puede venir después
  if (document.getElementById('carrito-lista')) {
    if (window.productosGlobal && window.productosGlobal.length) {
      renderCarrito();
    } else {
      let attempts = 0;
      const tryRender = () => {
        attempts++;
        if (window.productosGlobal && window.productosGlobal.length) {
          renderCarrito();
        } else if (attempts < 6) {
          setTimeout(tryRender, 200);
        } else {
          renderCarrito();
        }
      };
      tryRender();
    }
  }
});

// ----------------- Exposición global -----------------
window.cargarCarrito = cargarCarrito;
window.persistirCarrito = persistirCarrito;
window.agregarAlCarrito = agregarAlCarrito;
window.cambiarCantidadCarrito = cambiarCantidadCarrito;
window.eliminarItemCarrito = eliminarItemCarrito;
window.actualizarCarritoUI = actualizarCarritoUI;
window.renderCarrito = renderCarrito;
window.checkout = checkout;
window.aplicarCupon = aplicarCupon;
window.enrichCarritoFromFirestore = enrichCarritoFromFirestore;
window.loadProductosGlobalFromFirestore = loadProductosGlobalFromFirestore;