/***** Catálogo | Level-Up Gamer *****
 - Soporta productos MOCK y/o Firestore (si el SDK está presente)
 - Alineado con tu HTML:
   * #badge-carrito  (contador)
   * #busqueda       (buscador)
   * #filtro-categoria, #filtro-min, #filtro-max
   * #productos-lista (grid)
   * window.limpiarFiltros()
*************************************/

// ===== Mock de productos (fallback si no hay Firestore) =====
const PRODUCTOS_MOCK = [
  { cod:"JM001", cat:"Juegos de Mesa", nombre:"Catan", precio:29990, desc:"Un clásico juego de estrategia...", img:"catan2.jpg" },
  { cod:"JM002", cat:"Juegos de Mesa", nombre:"Carcassonne", precio:24990, desc:"Un juego de colocación de fichas...", img:"carcassonne.jpg" },
  { cod:"AC001", cat:"Accesorios", nombre:"Controlador Inalámbrico Xbox Series X", precio:59990, desc:"Botones mapeables y respuesta táctil.", img:"xbox_controller.webp" },
  { cod:"AC002", cat:"Accesorios", nombre:"Auriculares HyperX Cloud II", precio:79990, desc:"Sonido envolvente y micrófono desmontable.", img:"hyperx_cloud_ii_red_1_main.webp" },
  { cod:"CO001", cat:"Consolas", nombre:"PlayStation 5", precio:549990, desc:"Gráficos de última generación.", img:"ps5.webp" },
  { cod:"CG001", cat:"Computadores Gamers", nombre:"PC Gamer ASUS ROG Strix", precio:1299990, desc:"Rendimiento excepcional para gamers.", img:"rog_strix.jpg" },
  { cod:"SG001", cat:"Sillas Gamers", nombre:"Secretlab Titan", precio:349990, desc:"Soporte ergonómico ajustable.", img:"sillageimer.jpg" },
  { cod:"MS001", cat:"Mouse", nombre:"Logitech G502 HERO", precio:49990, desc:"Sensor de alta precisión y botones personalizables.", img:"g502-heroe.jpg" },
  { cod:"MP001", cat:"Mousepad", nombre:"Razer Goliathus Extended Chroma", precio:29990, desc:"Área amplia con iluminación RGB.", img:"mauspad.jpg" },
  { cod:"PP001", cat:"Poleras Personalizadas", nombre:"Polera 'Level-Up' Personalizada", precio:14990, desc:"Personaliza con tu gamer tag.", img:"poleraLevel.png" }
];

// ===== Utilidades =====
const $  = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);
const formateaCLP = (n) => (n || 0).toLocaleString('es-CL');
const isURL = (s) => typeof s === 'string' && /^https?:\/\//i.test(s);

// ===== Estado =====
let productosGlobal = [];                               // origen: Firestore o MOCK
let carrito = JSON.parse(localStorage.getItem('carrito') || '[]');

// ===== Elementos del DOM (todos opcionales para evitar caídas) =====
const badgeCarrito     = $('#badge-carrito');
const inputBusqueda    = $('#busqueda');
const selCategoria     = $('#filtro-categoria');
const inputMin         = $('#filtro-min');
const inputMax         = $('#filtro-max');
const gridProductos    = $('#productos-lista');

// ===== Inicialización =====
document.addEventListener('DOMContentLoaded', async () => {
  actualizarCarritoUI();

  // Si hay Firebase (compat) disponible, intenta cargar productos reales
  if (window.firebase && firebase.initializeApp) {
    try {
      // Ajusta tu config acá si corresponde
      const firebaseConfig = {
         apiKey: "AIzaSyCbVcEwCAFPJcvDwTCJnqtnyVJc4asYTHo",
         authDomain: "tiendalevelup-ccd23.firebaseapp.com",
         projectId: "tiendalevelup-ccd23",
      };
      // Evita re-inicializar si ya está
      if (!firebase.apps || !firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
      }
      const db = firebase.firestore();
      const snap = await db.collection('producto').get();
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));

      // Normaliza campos para que el renderer funcione igual que con el MOCK
      productosGlobal = docs.map(p => ({
        id: p.id,
        cod: p.cod || p.codigo || p.id || '',
        nombre: p.nombre || 'Producto',
        desc: p.descripcion || p.desc || '',
        precio: Number(p.precio) || 0,
        // Compat: Firestore usa 'categoria'
        cat: p.categoria || p.cat || 'Sin categoría',
        // Compat: Firestore usa 'imagen' (URL). Si no, usamos mock/placeholder.
        imagen: p.imagen || p.img || '',
        img: p.img || '' // por si quieres reusar path local
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
    // Sin Firebase → usar MOCK
    productosGlobal = [...PRODUCTOS_MOCK];
  }

  poblarCategorias(productosGlobal);
  renderProductos(productosGlobal);

  // Eventos
  if (inputBusqueda) {
    inputBusqueda.addEventListener('input', aplicarFiltros);
    inputBusqueda.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); aplicarFiltros(); }
    });
  }
  if (selCategoria) selCategoria.addEventListener('change', aplicarFiltros);
  if (inputMin)      inputMin.addEventListener('input', aplicarFiltros);
  if (inputMax)      inputMax.addEventListener('input', aplicarFiltros);

  // Exponer limpiarFiltros global
  window.limpiarFiltros = limpiarFiltros;
});

// ===== Render =====
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
    // Determina la imagen: Firestore (p.imagen URL), o local (../img/...), o placeholder
    const srcImg = p.imagen
      ? (isURL(p.imagen) ? p.imagen : `../img/${p.imagen}`)
      : (p.img ? `../img/${p.img}` : 'https://via.placeholder.com/400x300/1f1f1f/999999?text=Sin+Imagen');

    const cat = p.cat || p.categoria || 'Productos';
    const cod = encodeURIComponent(p.cod || p.id || '');
    const detalleHref = `product.html?cod=${cod}`;

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
            <p class="precio fw-bold mb-3">$${precio}</p>

            <div class="mt-auto d-grid gap-2">
              <a class="btn btn-outline-light" href="${detalleHref}">Ver detalle</a>
              <button class="btn btn-light text-dark btn-agregar" data-id="${p.id || p.cod}">🛒 Agregar</button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');

  // Listeners para "Agregar"
  $$('.btn-agregar').forEach(btn => {
    btn.addEventListener('click', () => {
      const id = btn.getAttribute('data-id');
      const prod = encontrarProductoPorId(id);
      if (prod) {
        agregarAlCarrito(prod);
        toast(`"${prod.nombre}" agregado al carrito`);
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

// ===== Filtros =====
function aplicarFiltros() {
  let term   = (inputBusqueda?.value || '').trim().toLowerCase();
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
  if (selCategoria)  selCategoria.value  = '';
  if (inputMin)      inputMin.value      = '';
  if (inputMax)      inputMax.value      = '';
  renderProductos(productosGlobal);
}

// ===== Carrito =====
function agregarAlCarrito(prod) {
  // Guardamos sólo campos necesarios
  const item = {
    id: prod.id || prod.cod,
    nombre: prod.nombre,
    precio: Number(prod.precio) || 0,
    imagen: prod.imagen || prod.img || ''
  };
  carrito.push(item);
  persistirCarrito();
  actualizarCarritoUI();
}

function persistirCarrito() {
  localStorage.setItem('carrito', JSON.stringify(carrito));
}

function actualizarCarritoUI() {
  const count = carrito.length;
  const total = carrito.reduce((s, p) => s + (Number(p.precio) || 0), 0);
  if (badgeCarrito) {
    badgeCarrito.textContent = String(count);       // Muestra cantidad en el header
    badgeCarrito.title = `Total: $${formateaCLP(total)}`; // Tooltip con total $
  }
}

// ===== Helpers =====
function encontrarProductoPorId(id) {
  return productosGlobal.find(p => (p.id || p.cod) == id);
}

function toast(mensaje) {
  const n = document.createElement('div');
  n.style.cssText = `
    position: fixed; top: 100px; right: 20px;
    background: #28a745; color: #fff; padding: 12px 16px;
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
