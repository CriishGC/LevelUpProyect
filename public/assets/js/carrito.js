// actualizado: ../js/carrito.js
// Cambios principales:
// - agregarAlCarrito ahora prioriza prod.precioOferta (si viene) al guardar el precio en carritoMeta y en el item persistido.
// - enrichCarritoFromFirestore ahora normaliza y guarda precioOferta cuando está presente en Firestore.
// - calcularTotales y actualizarCarritoUI usan precioOferta (si disponible) al calcular subtotales y totales.
// - preservé el resto de la lógica original y la compatibilidad con formatos antiguos.

/* eslint-disable no-console */
if (window.__LVUP_CARRITO_LOADED) {
  console.debug('carrito.js ya estaba cargado, saltando ejecución repetida.');
} else {
  window.__LVUP_CARRITO_LOADED = true;
  (function(){
  "use strict";

  window.__LVUP_FIREBASE_CONFIG = window.__LVUP_FIREBASE_CONFIG || {
  apiKey: "AIzaSyCbVcEwCAFPJcvDwTCJnqtnyVJc4asYTHo",
  authDomain: "tiendalevelup-ccd23.firebaseapp.com",
  projectId: "tiendalevelup-ccd23",
  storageBucket: "tiendalevelup-ccd23.appspot.com",
  messagingSenderId: "788122901795",
  appId: "1:788122901795:web:1feabe6474cd2b44ef4096",
  measurementId: "G-QHQ3RM5FD8"
};

var firebaseConfig = window.__LVUP_FIREBASE_CONFIG;

const STORAGE_KEY = 'carrito';
const META_KEY = STORAGE_KEY + '_meta';
let carrito = [];
let carritoMeta = {};
let cuponAplicado = localStorage.getItem(STORAGE_KEY + '_cupon') || '';
let firebaseEnabled = false;
let db = null;
const FIRESTORE_COLLECTION = 'productos';

if (typeof window.formateaCLP === 'undefined') {
  window.formateaCLP = function formateaCLP(n) {
    n = Number(n) || 0;
    return `$ ${n.toLocaleString('es-CL')}`;
  };
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
  // console.debug('[carrito.js]', ...args);
}

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

function cargarCarrito() {
  cargarMeta();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];

    const esFormatoAntiguo = Array.isArray(parsed) && parsed.length > 0 &&
      (parsed[0].precio !== undefined || parsed[0].nombre !== undefined);

    if (esFormatoAntiguo) {
      const mapa = new Map();
      parsed.forEach(p => {
        const id = p.id || p.cod || p.codigo || null;
        if (!id) return;
        mapa.set(String(id), (mapa.get(String(id)) || 0) + 1);
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

function initFirebaseIfAvailable() {
  if (window.firebase && firebase.initializeApp) {
    try {
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

async function fetchProductsFromFirestoreByIds(ids = []) {
  if (!firebaseEnabled || !db) return {};
  const out = {};
  const uniqueIds = Array.from(new Set(ids)).filter(Boolean).map(String);
  if (!uniqueIds.length) return out;

  const promises = uniqueIds.map(async id => {
    try {
      const docRef = db.collection(FIRESTORE_COLLECTION).doc(id);
      const docSnap = await docRef.get();
      if (docSnap && docSnap.exists) {
        out[String(id)] = { id: docSnap.id, ...docSnap.data() };
        return;
      }
      let q = await db.collection(FIRESTORE_COLLECTION).where('cod', '==', id).limit(1).get();
      if (!q.empty && q.docs.length) {
        const d = q.docs[0];
        out[String(id)] = { id: d.id, ...d.data() };
        return;
      }
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
    const nombre = d.nombre || d.name || d.title || d.nombreProducto || carritoMeta[id]?.nombre || d.cod || id;
    const precio = Number(d.precio || d.price || 0) || 0;
    // Normalizar precio de oferta si viene desde Firestore
    const precioOfertaFS = (typeof d.precio_oferta === 'number' && d.precio_oferta > 0) ? Number(d.precio_oferta)
                          : (typeof d.precioOferta === 'number' && d.precioOferta > 0) ? Number(d.precioOferta)
                          : undefined;
    const imagen = d.imagen || d.img || d.imagenURL || d.imagen_url || '';
    const stock = (d.stock !== undefined) ? (Number(d.stock) || 0) : (d.cantidad !== undefined ? Number(d.cantidad) : null);

    carritoMeta[id] = {
      nombre,
      precio: (precio || carritoMeta[id]?.precio || 0),
      precioOferta: (typeof precioOfertaFS !== 'undefined') ? precioOfertaFS : carritoMeta[id]?.precioOferta,
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

/*
  Modificación: agregarAlCarrito prioriza precioOferta si viene en el objeto prodOrId (o en carritoMeta).
  Si recibe un objeto con precioOferta, lo usará para cálculos y para mostrar en carrito.
*/
function agregarAlCarrito(prodOrId, qtyParam = 1) {
  cargarCarrito();
  cargarMeta();

  let qtyToAdd = 1;
  if (typeof prodOrId === 'object' && prodOrId !== null && prodOrId.qty !== undefined) {
    qtyToAdd = Math.max(1, Number(prodOrId.qty) || 1);
  } else {
    qtyToAdd = Math.max(1, Number(qtyParam) || 1);
  }

  let id, nombre, precio, precioOferta, imagen, stock;
  if (typeof prodOrId === 'string') {
    id = prodOrId;
  } else if (typeof prodOrId === 'object' && prodOrId !== null) {
    id = prodOrId.id || prodOrId.cod || prodOrId.codigo;
    nombre = prodOrId.nombre || prodOrId.name || prodOrId.title;
    // original price
    precio = Number(prodOrId.precio || prodOrId.price || 0);
    // new: preferir precioOferta si viene en el objeto
    precioOferta = (typeof prodOrId.precioOferta === 'number' && !Number.isNaN(prodOrId.precioOferta) && prodOrId.precioOferta > 0)
      ? Number(prodOrId.precioOferta)
      : (typeof prodOrId.precio_oferta === 'number' && !Number.isNaN(prodOrId.precio_oferta) && prodOrId.precio_oferta > 0)
        ? Number(prodOrId.precio_oferta)
        : undefined;

    imagen = prodOrId.imagen || prodOrId.img || prodOrId.imagenURL || '';
    stock = prodOrId.stock !== undefined ? Number(prodOrId.stock) : null;

    if (id) {
      // guardar meta: incluir precioOferta si aplica
      carritoMeta[String(id)] = {
        nombre: nombre || carritoMeta[String(id)]?.nombre || String(id),
        precio: precio || carritoMeta[String(id)]?.precio || 0,
        precioOferta: (typeof precioOferta !== 'undefined') ? precioOferta : carritoMeta[String(id)]?.precioOferta,
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

  // Calcular precio final que se guardará en carrito (priorizar precioOferta)
  const meta = carritoMeta[String(id)] || {};
  const precioFinal = (typeof meta.precioOferta === 'number' && !Number.isNaN(meta.precioOferta) && meta.precioOferta > 0)
    ? Number(meta.precioOferta)
    : (typeof precio === 'number' && precio > 0) ? Number(precio)
    : Number(meta.precio || 0);

  const idx = carrito.findIndex(i => String(i.id) === String(id));
  if (idx >= 0) {
    const metaLocal = carritoMeta[String(id)] || {};
    const stockAvailable = metaLocal.stock;
    const newQty = Number(carrito[idx].qty || 0) + qtyToAdd;
    if (stockAvailable !== undefined && stockAvailable !== null && newQty > stockAvailable) {
      toast('No hay suficiente stock disponible.');
      return;
    }
    carrito[idx].qty = newQty;
  } else {
    // Guardar solo id y qty en el array principal; el precio y demás van en carritoMeta
    carrito.push({ id: String(id), qty: qtyToAdd });

    // Asegurar que carritoMeta tenga el precio final para fallback UI rápido
    carritoMeta[String(id)] = {
      ...(carritoMeta[String(id)] || {}),
      precio: Number(carritoMeta[String(id)]?.precio || precioFinal || 0),
      precioOferta: (typeof carritoMeta[String(id)]?.precioOferta === 'number') ? carritoMeta[String(id)].precioOferta : (precioFinal || undefined)
    };
    persistirMeta();
  }

  persistirCarrito();
  actualizarCarritoUI();
  const nameForToast = nombre || (carritoMeta[String(id)] && carritoMeta[String(id)].nombre) || id;
  toast(`"${nameForToast}" agregado al carrito (${qtyToAdd})`);

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

    // Preferir precio de oferta en el orden:
    // 1) meta.precioOferta (desde añadir o Firestore)
    // 2) producto p.precio_oferta / p.precioOferta (si existe en productosGlobal)
    // 3) p.precio
    // 4) meta.precio
    let precio = 0;
    if (typeof meta.precioOferta === 'number' && !Number.isNaN(meta.precioOferta) && meta.precioOferta > 0) {
      precio = Number(meta.precioOferta);
    } else if (p) {
      const po = (typeof p.precio_oferta === 'number') ? p.precio_oferta
               : (typeof p.precioOferta === 'number') ? p.precioOferta
               : undefined;
      if (typeof po === 'number' && !Number.isNaN(po) && po > 0) precio = Number(po);
      else precio = Number(p.precio || p.price || 0);
    } else {
      precio = Number(meta.precio || 0);
    }

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
    // preferir precioOferta/meta, luego productosGlobal price
    const meta = carritoMeta[String(it.id)] || {};
    const p = fuentes.find(pp => (String(pp.id) === String(it.id) || String(pp.cod) === String(it.id)));
    let unitPrice = 0;
    if (typeof meta.precioOferta === 'number' && !Number.isNaN(meta.precioOferta) && meta.precioOferta > 0) {
      unitPrice = Number(meta.precioOferta);
    } else if (p) {
      const po = (typeof p.precio_oferta === 'number') ? p.precio_oferta
               : (typeof p.precioOferta === 'number') ? p.precioOferta
               : undefined;
      if (typeof po === 'number' && !Number.isNaN(po) && po > 0) unitPrice = Number(po);
      else unitPrice = Number(p.precio || p.price || 0);
    } else if (meta.precio) {
      unitPrice = Number(meta.precio || 0);
    }
    totalMoney += unitPrice * (Number(it.qty) || 0);
  });

  const badge = document.querySelector('#badge-carrito');
  if (badge) {
    badge.textContent = totalItems ? String(totalItems) : '';
    badge.title = `Total: ${formateaCLP(totalMoney)}`;
  }
  const cartCountAlt = document.querySelector('#cart-count');
  if (cartCountAlt) cartCountAlt.textContent = totalItems ? String(totalItems) : '';
  const carritoTotalEl = document.querySelector('.carrito-total');
  if (carritoTotalEl) carritoTotalEl.textContent = formateaCLP(totalMoney);
}

function renderCarrito() {
  const cont = document.getElementById('carrito-lista');
  const totalEl = document.getElementById('total');
  const descuentoEl = document.getElementById('descuento');
  const duocValidacionEl = document.getElementById('duoc-validacion');
  const { detalles, total, descuento, totalConDescuento } = calcularTotales();

  const resumenCont = document.getElementById('resumen-items');
  const btnLimpiar = document.getElementById('btn-limpiar-carrito');
  const btnPagar = document.getElementById('btn-pagar');
  const resumenEmpty = document.getElementById('resumen-empty');

  if (!detalles.length) {
    if (cont) cont.innerHTML = `<div class="alert alert-secondary">Tu carrito está vacío. Agrega productos desde el catálogo.</div>`;
    if (resumenCont) resumenCont.innerHTML = '';
    if (totalEl) totalEl.textContent = '$ 0';
    if (descuentoEl) descuentoEl.textContent = '';
    if (duocValidacionEl) duocValidacionEl.innerHTML = '';
    if (btnLimpiar) btnLimpiar.style.display = 'none';
    if (btnPagar) btnPagar.style.display = 'none';
    if (resumenEmpty) resumenEmpty.style.display = 'block';
    return;
  }

  if (cont) {
    cont.innerHTML = detalles.map(d => {
    const p = d.producto;
    const meta = d.meta || {};
    const nombre = p ? (p.nombre || p.name || p.title) : (meta.nombre || d.id);
    const precioStr = formateaCLP(d.precio);

    let imgPath = '';
    if (p) {
      const candidate = p.imagen || p.img || p.imagenURL || p.imagen_url || '';
      imgPath = candidate ? (isURL(candidate) ? candidate : `../img/${candidate}`) : '';
    }
    if (!imgPath && meta.imagen) imgPath = isURL(meta.imagen) ? meta.imagen : `../img/${meta.imagen}`;
    if (!imgPath) imgPath = 'https://via.placeholder.com/200x150';

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
  }

  if (resumenCont) {
    resumenCont.innerHTML = detalles.map(d => {
      const p = d.producto;
      const nombre = p ? (p.nombre || p.name || p.title) : (d.meta && d.meta.nombre) || d.id;
      const imgSmall = (p && (p.imagen || p.img)) ? (isURL(p.imagen || p.img) ? (p.imagen || p.img) : `../img/${p.imagen || p.img}`) : (d.meta && d.meta.imagen ? (isURL(d.meta.imagen) ? d.meta.imagen : `../img/${d.meta.imagen}`) : 'https://via.placeholder.com/80');
      const unitPrice = formateaCLP(d.precio);
      const qty = d.qty || 0;
      return `
          <div class="res-item d-flex align-items-center mb-2">
            <img src="${imgSmall}" class="res-thumb rounded me-2" alt="${escapeHtml(nombre)}" onerror="this.src='https://via.placeholder.com/80'">
            <div class="res-info flex-grow-1">
              <div class="res-name mb-0">${escapeHtml(nombre)}</div>
              <div class="res-meta small text-muted">${formateaCLP(d.subtotal)}</div>
            </div>
            <div class="res-right d-flex flex-column align-items-end">
              <div class="unit-price">${unitPrice}</div>
              <div class="res-qty-control mt-1">
                <button class="btn-res-qty" onclick="cambiarCantidadCarrito('${d.id}', ${Math.max(0, qty - 1)})">−</button>
                <span class="res-qty-num">${qty}</span>
                <button class="btn-res-qty" onclick="cambiarCantidadCarrito('${d.id}', ${qty + 1})">+</button>
              </div>
              <div class="res-subtotal small mt-1">${formateaCLP(d.subtotal)}</div>
            </div>
          </div>
        `;
    }).join('');
  }

  if (btnLimpiar) btnLimpiar.style.display = 'inline-block';
  if (btnPagar) btnPagar.style.display = 'inline-block';
  if (resumenEmpty) resumenEmpty.style.display = 'none';

  if (totalEl) totalEl.textContent = formateaCLP(totalConDescuento);
  if (descuentoEl) {
    descuentoEl.textContent = descuento > 0 ? `Descuento: -${formateaCLP(descuento)} (Cupón: ${cuponAplicado})` : '';
  }
  if (duocValidacionEl) duocValidacionEl.innerHTML = '';
}

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
   window.location.href = '/assets/page/checkout.html';
}

async function __lvup_carrito_init() {
  cargarCarrito();
  cargarMeta();
  cuponAplicado = localStorage.getItem(STORAGE_KEY + '_cupon') || '';

  initFirebaseIfAvailable();

  if (firebaseEnabled) {
    try {
      await loadProductosGlobalFromFirestore().catch(() => {});
      await enrichCarritoFromFirestore();
    } catch (e) {
      console.warn('Error enriqueciendo carrito desde Firestore:', e);
    }
  }

  try {
    renderOfertas();
  } catch (e) { /* noop */ }

  const btnCupon = document.getElementById('btn-aplicar-cupon');
  if (btnCupon) btnCupon.addEventListener('click', aplicarCupon);
  const btnLimpiar = document.getElementById('btn-limpiar-carrito');
  if (btnLimpiar) btnLimpiar.addEventListener('click', function(){ if (confirm('¿Limpiar todo el carrito?')) limpiarCarrito(); });

  actualizarCarritoUI();

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
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', __lvup_carrito_init);
} else {
  __lvup_carrito_init();
}

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
window.actualizarBadgeCarrito = actualizarCarritoUI;

function limpiarCarrito() {
  carrito = [];
  carritoMeta = {};
  persistirCarrito();
  persistirMeta();
  actualizarCarritoUI();
  renderCarrito();
  toast('Carrito limpiado.');
}
window.limpiarCarrito = limpiarCarrito;

  })();
}

function renderOfertas() {
  const cont = document.getElementById('ofertas-list');
  if (!cont) return;
  const fuentes = (window.productosGlobal && window.productosGlobal.length) ? window.productosGlobal
                : (window.PRODUCTOS_MOCK && window.PRODUCTOS_MOCK.length) ? window.PRODUCTOS_MOCK
                : (window.PRODUCTOS && window.PRODUCTOS.length) ? window.PRODUCTOS
                : [];
  const lista = (fuentes || []).slice(0, 6);
  cont.innerHTML = lista.map(p => {
    const src = (p.imagen && isURL(p.imagen)) ? p.imagen : (p.imagen ? `../img/${p.imagen}` : (p.img ? `../img/${p.img}` : 'https://via.placeholder.com/400x300'));
    const nombre = p.nombre || p.name || p.title || '';
    const precio = formateaCLP(Number(p.precio || p.price || 0));
    const cod = encodeURIComponent(p.cod || p.id || '');
    return `
      <div class="col-6 col-md-4">
        <div class="card product-card bg-secondary text-light h-100">
          <img src="${src}" class="card-img-top" alt="${escapeHtml(nombre)}" onerror="this.src='https://via.placeholder.com/400x300'">
          <div class="card-body p-2 text-center">
            <div class="small mb-1">${escapeHtml(nombre)}</div>
            <div class="small fw-bold mb-2">${precio}</div>
            <div class="d-grid">
              <a class="btn btn-sm btn-outline-light" href="product.html?cod=${cod}">Ver</a>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

try {
  if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', function() {
      try { if (typeof cargarCarrito === 'function') cargarCarrito(); } catch (e) { /* noop */ }
      try { if (typeof actualizarCarritoUI === 'function') actualizarCarritoUI(); } catch (e) { /* noop */ }
      try { if (typeof renderCarrito === 'function') renderCarrito(); } catch (e) { /* noop */ }
      try { if (typeof renderDetalleProducto === 'function') renderDetalleProducto(); } catch (e) { /* noop */ }
    });
  }
} catch (e) { /* noop */ }