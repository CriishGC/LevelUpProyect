const $  = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);
if (typeof window.formateaCLP === 'undefined') {
  window.formateaCLP = (n) => (n || 0).toLocaleString('es-CL');
}
const isURL = (s) => typeof s === 'string' && /^https?:\/\//i.test(s);

let productosGlobal = [];
let carrito = JSON.parse(localStorage.getItem('carrito') || '[]');
let db = null;

const badgeCarrito     = $('#badge-carrito');
const inputBusqueda    = $('#busqueda') || $('#buscador');
const buscadorAlt      = $('#buscador');
const selCategoria     = $('#filtro-categoria');
const inputMin         = $('#filtro-min');
const inputMax         = $('#filtro-max');
const gridProductos    = $('#productos-lista') || $('#productosGrid');

const dropdownCategorias = $('#dropdownCategorias');
const cardsCategorias    = $('#cardsCategorias');
const tituloProductos    = $('#tituloProductos');
const btnBuscar          = $('#btnBuscar');
const btnVerTodos        = $('#btnVerTodos');
const carritoTotalElem   = document.querySelector('.carrito-total');
const btnCarrito         = document.querySelector('.btn-carrito');

document.addEventListener('DOMContentLoaded', async () => {
  actualizarCarritoUI();
  actualizarCarritoTotal();
  actualizarContadorItemsCarrito();

  if (window.firebase && firebase.initializeApp) {
    try {
      const firebaseConfig = {
         apiKey: "AIzaSyCbVcEwCAFPJcvDwTCJnqtnyVJc4asYTHo",
         authDomain: "tiendalevelup-ccd23.firebaseapp.com",
         projectId: "tiendalevelup-ccd23",
      };
      if (!firebase.apps || !firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      db = firebase.firestore();

      let snap = null;
      try {
        snap = await db.collection('productos').get();
        if (!snap || snap.empty) {
          snap = await db.collection('producto').get();
        }
      } catch (e) {
        console.warn('Error consultando colecciones productos/producto:', e);
        snap = null;
      }

      const docs = (snap && snap.docs) ? snap.docs.map(d => ({ id: d.id, ...d.data() })) : [];

      productosGlobal = docs.map(p => ({
        id: p.id,
        cod: p.cod || p.codigo || p.id || '',
        nombre: p.nombre || 'Producto',
        desc: p.descripcion || p.desc || '',
        precio: Number(p.precio) || 0,
        cat: p.categoria || p.cat || 'Sin categoría',
        categoria: p.categoria || p.cat || 'Sin categoría', 
        imagen: p.imagen || p.img || '',
        img: p.img || '',
        stock: typeof p.stock !== 'undefined' ? Number(p.stock) : undefined
      }));

      if (!productosGlobal.length) {
        console.warn('No hay productos en Firestore, usando MOCK.');
        productosGlobal = [...PRODUCTOS_MOCK];
      }
    } catch (e) {
      console.warn('Error cargando Firestore, usando MOCK.', e);
      productosGlobal = [...PRODUCTOS_MOCK];
    }
  } else {
    productosGlobal = [...PRODUCTOS_MOCK];
  }

  poblarCategorias(productosGlobal);
  const categoriasUnicas = obtenerCategoriasUnicas(productosGlobal);
  if (dropdownCategorias) mostrarDropdownCategorias(categoriasUnicas);
  if (cardsCategorias)    mostrarCardsCategorias(categoriasUnicas);

  renderProductos(productosGlobal);

  if (inputBusqueda) {
    inputBusqueda.addEventListener('input', aplicarFiltrosDesdeInputs);
    inputBusqueda.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); aplicarFiltrosDesdeInputs(); }
    });
  }
  if (buscadorAlt && buscadorAlt !== inputBusqueda) {
    buscadorAlt.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') buscarProductos();
    });
  }
  if (btnBuscar) btnBuscar.addEventListener('click', buscarProductos);
  if (selCategoria) selCategoria.addEventListener('change', aplicarFiltrosDesdeInputs);
  if (inputMin)      inputMin.addEventListener('input', aplicarFiltrosDesdeInputs);
  if (inputMax)      inputMax.addEventListener('input', aplicarFiltrosDesdeInputs);
  if (btnVerTodos)   btnVerTodos.addEventListener('click', mostrarTodosLosProductos);
  if (btnCarrito)    btnCarrito.addEventListener('click', () => window.location.href = 'carrito.html');

  // Inicializar búsqueda desde querystring (?q=...) o desde localStorage (catalog_search)
  try {
    const params = new URLSearchParams(window.location.search || '');
    const qParam = (params.get('q') || '').trim();
    const stored = (localStorage.getItem('catalog_search') || '').trim();
    const initial = qParam || stored || '';
    if (initial) {
      if (inputBusqueda) inputBusqueda.value = initial;
      if (buscadorAlt) buscadorAlt.value = initial;
      // Ejecutar búsqueda (usar buscarProductos para mantener consistencia)
      try { buscarProductos(); } catch(e) { aplicarFiltrosDesdeInputs(); }
      try { localStorage.removeItem('catalog_search'); } catch(e) { /* noop */ }
    }
  } catch (err) { console.warn('Error aplicando búsqueda inicial:', err); }

  window.limpiarFiltros = limpiarFiltros;
  window.mostrarTodosLosProductos = mostrarTodosLosProductos;
  window.getProductosGlobal = () => productosGlobal;
  window.getCarrito = () => carrito;

  if (db) escucharCambiosStock();

  console.log("Catálogo inicializado correctamente");
});

function renderProductos(lista) {
  if (!gridProductos) return;

  if (!lista || !lista.length) {
    gridProductos.innerHTML = `
      <div class="text-center text-secondary py-5">
        <p class="mb-3">No se encontraron productos con los filtros aplicados.</p>
        <button class="btn btn-outline-light" id="btn-reset-filtros">Ver todos</button>
      </div>
    `;
    const btn = $('#btn-reset-filtros');
    if (btn) btn.addEventListener('click', limpiarFiltros);
    return;
  }

  gridProductos.innerHTML = lista.map(p => {
    const precio = formateaCLP(p.precio);
    const srcImg = p.imagen
      ? (isURL(p.imagen) ? p.imagen : `../img/${p.imagen}`)
      : (p.img ? `../img/${p.img}` : 'https://via.placeholder.com/400x300/1f1f1f/999999?text=Sin+Imagen');

    const cat = p.cat || p.categoria || 'Productos';
    const cod = encodeURIComponent(p.cod || p.id || '');
    const detalleHref = `product.html?cod=${cod}`;

    const stockHTML = (typeof p.stock !== 'undefined')
      ? `<p class="producto-stock mb-2">Stock: ${p.stock}</p>`
      : '';

    return `
      <div class="col-sm-6 col-md-4 col-lg-3 mb-4">
        <div class="card bg-secondary text-light h-100 product-card">
          <img src="${srcImg}"
               class="card-img-top"
               alt="${escapeHtml(p.nombre)}"
               onerror="this.src='https://via.placeholder.com/400x300/1f1f1f/999999?text=Sin+Imagen'">
          <div class="card-body d-flex flex-column">
            <h5 class="card-title">${escapeHtml(p.nombre)}</h5>
            <span class="badge bg-primary mb-2">${escapeHtml(cat)}</span>
            <p class="precio fw-bold mb-1">$${precio}</p>
            ${stockHTML}
            <div class="mt-auto d-grid gap-2">
              <a class="btn btn-outline-light" href="${detalleHref}">Ver detalle</a>
              <button class="btn btn-light text-dark btn-agregar" data-id="${p.id || p.cod}">🛒 Agregar</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  $$('.btn-agregar').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const prod = encontrarProductoPorId(id);
      if (prod) {
        agregarAlCarrito(prod);
        toast(`"${prod.nombre}" agregado al carrito`);
      } else {
        toast('Producto no encontrado', 'error');
      }
    });
  });
}

function poblarCategorias(lista) {
  if (!selCategoria) return;
  const setCats = new Set();
  (lista || []).forEach(p => setCats.add(p.cat || p.categoria || 'Sin categoría'));
  const cats = Array.from(setCats).sort((a,b)=>a.localeCompare(b,'es'));

  selCategoria.innerHTML = [
    `<option value="">Todas las categorías</option>`,
    ...cats.map(c => `<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`)
  ].join('');
}

function aplicarFiltrosDesdeInputs() {
  let term   = (inputBusqueda?.value || buscadorAlt?.value || '').trim().toLowerCase();
  let catVal = (selCategoria?.value || '').trim();
  let minVal = Number(inputMin?.value || '');
  let maxVal = Number(inputMax?.value || '');

  let lista = [...productosGlobal];

  if (term) {
    lista = lista.filter(p =>
      (p.nombre && p.nombre.toLowerCase().includes(term)) ||
      ((p.desc || p.descripcion || '').toLowerCase().includes(term)) ||
      ((p.cat || p.categoria || '').toLowerCase().includes(term))
    );
  }

  if (catVal) {
    lista = lista.filter(p => (p.cat || p.categoria || '') === catVal);
  }

  if (!Number.isNaN(minVal)) {
    lista = lista.filter(p => (Number(p.precio) || 0) >= (minVal || 0));
  }
  if (!Number.isNaN(maxVal) && maxVal > 0) {
    lista = lista.filter(p => (Number(p.precio) || 0) <= maxVal);
  }

  renderProductos(lista);
}

function limpiarFiltros() {
  if (inputBusqueda) inputBusqueda.value = '';
  if (buscadorAlt) buscadorAlt.value = '';
  if (selCategoria)  selCategoria.value  = '';
  if (inputMin)      inputMin.value      = '';
  if (inputMax)      inputMax.value      = '';
  renderProductos(productosGlobal);
}

function agregarAlCarrito(prodOrId) {
  let prod = typeof prodOrId === 'object' ? prodOrId : encontrarProductoPorId(prodOrId);
  if (!prod) return;

  const idx = productosGlobal.findIndex(p => (p.id || p.cod) == (prod.id || prod.cod));
  const stockActual = (idx !== -1 && typeof productosGlobal[idx].stock !== 'undefined')
    ? productosGlobal[idx].stock
    : undefined;

  if (typeof stockActual !== 'undefined' && stockActual <= 0) {
    mostrarNotificacion('Producto sin stock disponible', 'error');
    return;
  }

  const itemId = prod.id || prod.cod;
  let productoExistente = carrito.find(it => it.id === itemId);
  if (productoExistente) {
    productoExistente.cantidad = (productoExistente.cantidad || 1) + 1;
  } else {
    carrito.push({
      id: itemId,
      nombre: prod.nombre,
      precio: Number(prod.precio) || 0,
      imagen: prod.imagen || prod.img || '',
      cantidad: 1
    });
  }

  persistirCarrito();
  actualizarCarritoUI();
  actualizarCarritoTotal();
  actualizarContadorItemsCarrito();

  if (db && prod.id) {
    actualizarStockFirebase(prod.id, 1).catch(e => console.warn(e));
  } else {
    if (idx !== -1 && typeof productosGlobal[idx].stock !== 'undefined') {
      productosGlobal[idx].stock = productosGlobal[idx].stock - 1;
      renderProductos(getProductosFiltradosActuales());
    }
  }
}

function persistirCarrito() {
  localStorage.setItem('carrito', JSON.stringify(carrito));
}

function actualizarCarritoUI() {
  const count = carrito.reduce((sum, it) => sum + (it.cantidad || 1), 0);
  const total = carrito.reduce((s, p) => s + (Number(p.precio) || 0) * (p.cantidad || 1), 0);
  if (badgeCarrito) {
    badgeCarrito.textContent = String(count);
    badgeCarrito.title = `Total: $${formateaCLP(total)}`;
  }
  if (carritoTotalElem) {
    carritoTotalElem.textContent = total.toLocaleString('es-CL');
  }
}

function encontrarProductoPorId(id) {
  return productosGlobal.find(p => (p.id || p.cod) == id);
}

function toast(mensaje, tipo = 'success') {
  const n = document.createElement('div');
  const background = tipo === 'success' ? '#28a745' : '#dc3545';
  n.style.cssText = `
    position: fixed; top: 100px; right: 20px;
    background: ${background}; color: #fff; padding: 12px 16px;
    border-radius: 6px; z-index: 10000; box-shadow: 0 6px 18px rgba(0,0,0,.3);
    font-weight: 600;
  `;
  n.textContent = mensaje;
  document.body.appendChild(n);
  setTimeout(() => n.remove(), 2500);
}

function escapeHtml(s='') {
  return String(s)
    .replaceAll('&','&amp;')
    .replaceAll('<','&lt;')
    .replaceAll('>','&gt;')
    .replaceAll('"','&quot;')
    .replaceAll("'",'&#39;');
}

function obtenerCategoriasUnicas(productos) {
  const set = new Set();
  (productos || []).forEach(p => {
    const c = p.categoria || p.cat || 'Sin categoría';
    if (c) set.add(c);
  });
  return Array.from(set).sort((a,b)=>a.localeCompare(b,'es'));
}

function mostrarDropdownCategorias(categorias) {
  if (!dropdownCategorias) return;
  dropdownCategorias.innerHTML = categorias.map(categoria => `
    <a href="#" class="dropdown-item" data-categoria="${escapeHtml(categoria)}">${escapeHtml(categoria)}</a>
  `).join('');
  dropdownCategorias.addEventListener('click', (e) => {
    e.preventDefault();
    const target = e.target;
    if (target.classList.contains('dropdown-item')) {
      const categoria = target.dataset.categoria;
      filtrarPorCategoria(categoria);
    }
  });
}

function mostrarCardsCategorias(categorias) {
  if (!cardsCategorias) return;
  cardsCategorias.innerHTML = categorias.map(categoria => `
    <div class="categoria-card" data-categoria="${escapeHtml(categoria)}">
      <div class="categoria-img">${obtenerIconoCategoria(categoria)}</div>
      <div class="categoria-nombre">${escapeHtml(categoria)}</div>
    </div>
  `).join('');
  cardsCategorias.addEventListener('click', (e) => {
    const card = e.target.closest('.categoria-card');
    if (card) {
      filtrarPorCategoria(card.dataset.categoria);
    }
  });
}

function obtenerIconoCategoria(categoria) {
  const iconos = {
    'Poleras personalizadas': '👕',
    'Computadores gamers': '💻',
    'Consolas': '🎮',
    'Juegos de mesa': '🎲',
    'Mouse': '🖱️',
    'Mousepad': '🖥️',
    'Sillas gamers': '🪑',
    'Accesorios': '🎧'
  };
  return iconos[categoria] || '📦';
}

function filtrarPorCategoria(categoria) {
  const productosFiltrados = productosGlobal.filter(p => (p.categoria || p.cat) === categoria);
  if (tituloProductos) tituloProductos.textContent = `${categoria} (${productosFiltrados.length} productos)`;
  renderProductos(productosFiltrados);
  if (selCategoria) selCategoria.value = categoria;
}

function mostrarTodosLosProductos() {
  if (tituloProductos) tituloProductos.textContent = `Todos los productos (${productosGlobal.length})`;
  if (inputBusqueda) inputBusqueda.value = '';
  if (buscadorAlt) buscadorAlt.value = '';
  if (selCategoria) selCategoria.value = '';
  renderProductos(productosGlobal);
}

function buscarProductos() {
  const termino = (buscadorAlt?.value || inputBusqueda?.value || '').toLowerCase().trim();
  if (!termino) {
    mostrarTodosLosProductos();
    return;
  }
  const productosFiltrados = productosGlobal.filter(p =>
    (p.nombre || '').toLowerCase().includes(termino) ||
    (p.categoria || '').toLowerCase().includes(termino) ||
    (p.descripcion || p.desc || '').toLowerCase().includes(termino)
  );
  if (tituloProductos) tituloProductos.textContent = `Resultados para "${termino}" (${productosFiltrados.length})`;
  renderProductos(productosFiltrados);
}

function actualizarCarritoTotal() {
  const total = carrito.reduce((sum, producto) => sum + ((producto.precio || 0) * (producto.cantidad || 1)), 0);
  if (carritoTotalElem) carritoTotalElem.textContent = total.toLocaleString('es-CL');
}

function obtenerTotalItemsCarrito() {
  return carrito.reduce((total, producto) => total + (producto.cantidad || 1), 0);
}

function actualizarContadorItemsCarrito() {
  const contadorItems = document.querySelector('.carrito-count');
  if (contadorItems) {
    contadorItems.textContent = `(${obtenerTotalItemsCarrito()})`;
  }
}

async function actualizarStockFirebase(productId, cantidad) {
  if (!db) return;
  try {
    const productoRef = db.collection("producto").doc(productId);
    const productoDoc = await productoRef.get();

    if (productoDoc.exists) {
      const stockActual = typeof productoDoc.data().stock !== 'undefined' ? Number(productoDoc.data().stock) : undefined;
      const nuevoStock = typeof stockActual !== 'undefined' ? stockActual - cantidad : undefined;
      if (typeof nuevoStock !== 'undefined') {
        await productoRef.update({ stock: nuevoStock });
      }
      const index = productosGlobal.findIndex(p => p.id === productId);
      if (index !== -1 && typeof nuevoStock !== 'undefined') {
        productosGlobal[index].stock = nuevoStock;
        renderProductos(getProductosFiltradosActuales());
      }
    }
  } catch (error) {
    console.error("Error actualizando stock en Firebase:", error);
  }
}

async function restaurarStockFirebase(productId, cantidad) {
  if (!db) return;
  try {
    const productoRef = db.collection("producto").doc(productId);
    const productoDoc = await productoRef.get();

    if (productoDoc.exists) {
      const stockActual = typeof productoDoc.data().stock !== 'undefined' ? Number(productoDoc.data().stock) : undefined;
      const nuevoStock = typeof stockActual !== 'undefined' ? stockActual + cantidad : undefined;
      if (typeof nuevoStock !== 'undefined') {
        await productoRef.update({ stock: nuevoStock });
      }
      const index = productosGlobal.findIndex(p => p.id === productId);
      if (index !== -1 && typeof nuevoStock !== 'undefined') {
        productosGlobal[index].stock = nuevoStock;
        renderProductos(getProductosFiltradosActuales());
      }
    }
  } catch (error) {
    console.error("Error restaurando stock en Firebase:", error);
  }
}

function escucharCambiosStock() {
  if (!db) return;
  db.collection("producto").onSnapshot((snapshot) => {
    snapshot.docChanges().forEach((change) => {
      if (change.type === "modified") {
        const productoActualizado = { id: change.doc.id, ...change.doc.data() };
        const index = productosGlobal.findIndex(p => p.id === productoActualizado.id);
        if (index !== -1) {
          productosGlobal[index] = {
            ...productosGlobal[index],
            ...productoActualizado,
            cat: productoActualizado.categoria || productoActualizado.cat || productosGlobal[index].cat
          };
          renderProductos(getProductosFiltradosActuales());
        }
      }
    });
  });
}

async function limpiarCarritoYRestaurarStock() {
  if (carrito.length === 0) return;

  try {
    for (const producto of carrito) {
      const cantidad = producto.cantidad || 1;
      if (db && producto.id) {
        await restaurarStockFirebase(producto.id, cantidad);
      } else {
        const idx = productosGlobal.findIndex(p => (p.id || p.cod) === producto.id);
        if (idx !== -1 && typeof productosGlobal[idx].stock !== 'undefined') {
          productosGlobal[idx].stock += cantidad;
        }
      }
    }

    carrito = [];
    localStorage.removeItem('carrito');
    actualizarCarritoTotal();
    actualizarContadorItemsCarrito();
    actualizarCarritoUI();
    mostrarNotificacion('Carrito limpiado y stock restaurado');
  } catch (error) {
    console.error("Error limpiando carrito:", error);
  }
}

window.limpiarCarrito = limpiarCarritoYRestaurarStock;

function getProductosFiltradosActuales() {
  let term   = (inputBusqueda?.value || buscadorAlt?.value || '').trim().toLowerCase();
  let catVal = (selCategoria?.value || '').trim();
  let minVal = Number(inputMin?.value || '');
  let maxVal = Number(inputMax?.value || '');

  let lista = [...productosGlobal];

  if (term) {
    lista = lista.filter(p =>
      (p.nombre && p.nombre.toLowerCase().includes(term)) ||
      ((p.desc || p.descripcion || '').toLowerCase().includes(term)) ||
      ((p.cat || p.categoria || '').toLowerCase().includes(term))
    );
  }

  if (catVal) {
    lista = lista.filter(p => (p.cat || p.categoria || '') === catVal);
  }

  if (!Number.isNaN(minVal)) {
    lista = lista.filter(p => (Number(p.precio) || 0) >= (minVal || 0));
  }
  if (!Number.isNaN(maxVal) && maxVal > 0) {
    lista = lista.filter(p => (Number(p.precio) || 0) <= maxVal);
  }
  return lista;
}