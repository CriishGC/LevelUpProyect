// CATEGORÍAS Y PRODUCTOS
const CATEGORIAS = [
  "Juegos de Mesa","Accesorios","Consolas","Computadores Gamers",
  "Sillas Gamers","Mouse","Mousepad","Poleras Personalizadas"
];

const PRODUCTOS = [
  { cod:"JM001", cat:"Juegos de Mesa", nombre:"Catan", precio:29990, desc:"Un clásico juego de estrategia donde los jugadores compiten por colonizar y expandirse en la isla de Catan. Ideal para 3-4 jugadores y perfecto para noches de juego en familia o con amigos.", img:"catan2.jpg" },
  { cod:"JM002", cat:"Juegos de Mesa", nombre:"Carcassonne", precio:24990, desc:"Un juego de colocación de fichas donde los jugadores construyen el paisaje alrededor de la fortaleza medieval de Carcassonne. Ideal para 2-5 jugadores y fácil de aprender.", img:"carcassonne.jpg" },
  { cod:"AC001", cat:"Accesorios", nombre:"Controlador Inalámbrico Xbox Series X", precio:59990, desc:"Ofrece una experiencia de juego cómoda con botones mapeables y una respuesta táctil mejorada. Compatible con consolas Xbox y PC.", img:"xbox_controller.webp" },
  { cod:"AC002", cat:"Accesorios", nombre:"Auriculares HyperX Cloud II", precio:79990, desc:"Proporcionan un sonido envolvente de calidad con un micrófono desmontable y almohadillas de espuma viscoelástica para mayor comodidad durante largas sesiones de juego.", img:"hyperx_cloud_ii_red_1_main.webp" },
  { cod:"CO001", cat:"Consolas", nombre:"PlayStation 5", precio:549990, desc:"La consola de última generación de Sony, que ofrece gráficos impresionantes y tiempos de carga ultrarrápidos para una experiencia de juego inmersiva.", img:"ps5.webp" },
  { cod:"CG001", cat:"Computadores Gamers", nombre:"PC Gamer ASUS ROG Strix", precio:1299990, desc:"Un potente equipo diseñado para los gamers más exigentes, equipado con los últimos componentes para ofrecer un rendimiento excepcional en cualquier juego.", img:"rog_strix.jpg" },
  { cod:"SG001", cat:"Sillas Gamers", nombre:"Secretlab Titan", precio:349990, desc:"Diseñada para el máximo confort, esta silla ofrece un soporte ergonómico y personalización ajustable para sesiones de juego prolongadas.", img:"sillageimer.jpg" },
  { cod:"MS001", cat:"Mouse", nombre:"Logitech G502 HERO", precio:49990, desc:"Con sensor de alta precisión y botones personalizables, este mouse es ideal para gamers que buscan un control preciso y personalización.", img:"g502-heroe.jpg" },
  { cod:"MP001", cat:"Mousepad", nombre:"Razer Goliathus Extended Chroma", precio:29990, desc:"Ofrece un área de juego amplia con iluminación RGB personalizable, asegurando una superficie suave y uniforme para el movimiento del mouse.", img:"mauspad.jpg" },
  { cod:"PP001", cat:"Poleras Personalizadas", nombre:"Polera 'Level-Up' Personalizada", precio:14990, desc:"Una camiseta cómoda y estilizada, con la posibilidad de personalizarla con tu gamer tag o diseño favorito.", img:"poleraLevel.png" }
];

// UTILS
function formateaCLP(n){ return n.toLocaleString("es-CL")+" CLP"; }
function getImgPath(filename) { return "../img/" + filename; }
const $ = sel => document.querySelector(sel);
const $$ = sel => document.querySelectorAll(sel);

// ESTADO GLOBAL
const REVIEWS = {};
const estado = {
  usuario: { nombre: "", correo: "", nacimiento: "", referido: "", esDuoc: false, puntos: 0, nivel: "Bronce" },
  carrito: [] // [{cod,nombre,precio,qty}]
};

// ===== USUARIO MULTIPÁGINA =====
function guardarUsuarioEnLocalStorage(usuario) {
  localStorage.setItem("usuario", JSON.stringify(usuario));
}

function cargarUsuarioDesdeLocalStorage() {
  try {
    const data = localStorage.getItem("usuario");
    estado.usuario = data ? JSON.parse(data) : {
      nombre: "",
      correo: "",
      nacimiento: "",
      referido: "",
      esDuoc: false,
      puntos: 0,
      nivel: "Bronce"
    };
  } catch(e) {
    estado.usuario = {
      nombre: "",
      correo: "",
      nacimiento: "",
      referido: "",
      esDuoc: false,
      puntos: 0,
      nivel: "Bronce"
    };
  }
}

// ===== CARRITO PERSISTENTE multi-página =====
function cargarCarrito() {
  try {
    const data = localStorage.getItem("carrito");
    estado.carrito = data ? JSON.parse(data) : [];
  } catch(e) { estado.carrito = []; }
}
function guardarCarrito() {
  localStorage.setItem("carrito", JSON.stringify(estado.carrito));
}
function actualizarBadgeCarrito() {
  cargarCarrito();
  const totalUnidades = estado.carrito.reduce((a,i)=>a+i.qty,0);
  const badge = $("#badge-carrito");
  if (badge) badge.textContent = totalUnidades;
}
function agregarAlCarrito(cod){
  cargarCarrito();
  const prod = PRODUCTOS.find(p=>p.cod===cod);
  if(!prod) return;
  const item = estado.carrito.find(i=>i.cod===cod);
  if(item) item.qty++;
  else estado.carrito.push({ cod: prod.cod, nombre: prod.nombre, precio: prod.precio, qty: 1 });
  guardarCarrito();
  actualizarBadgeCarrito();
  if (typeof renderCarrito === "function") renderCarrito();
}
function quitarDelCarrito(idx){
  cargarCarrito();
  estado.carrito.splice(idx,1);
  guardarCarrito();
  actualizarBadgeCarrito();
  if (typeof renderCarrito === "function") renderCarrito();
}
function cambiarQty(idx, delta){
  cargarCarrito();
  const it = estado.carrito[idx];
  if(!it) return;
  it.qty = Math.max(1, it.qty + delta);
  guardarCarrito();
  if (typeof renderCarrito === "function") renderCarrito();
  actualizarBadgeCarrito();
}
function renderCarrito(){
  cargarCarrito();
  const list=$("#carrito-lista");
  if(!list) return;
  if(estado.carrito.length===0){
    list.innerHTML = `<div class="list-group-item bg-dark text-light">Tu carrito está vacío.</div>`;
    if ($("#total")) $("#total").textContent = "$ 0";
  }else{
    list.innerHTML = estado.carrito.map((it,idx)=>`
      <div class="list-group-item bg-dark text-light d-flex justify-content-between align-items-center">
        <div>
          <strong>${it.nombre}</strong><br>
          <small>${formateaCLP(it.precio)} c/u</small>
        </div>
        <div class="d-flex align-items-center gap-2">
          <button class="btn btn-sm btn-outline-light" onclick="cambiarQty(${idx},-1)">−</button>
          <span>${it.qty}</span>
          <button class="btn btn-sm btn-outline-light" onclick="cambiarQty(${idx},1)">+</button>
          <span class="fw-bold">${formateaCLP(it.precio*it.qty)}</span>
          <button class="btn btn-sm btn-danger" onclick="quitarDelCarrito(${idx})">X</button>
        </div>
      </div>
    `).join("");
    actualizarTotales();
  }
  actualizarBadgeCarrito();
}

// MULTI-PESTAÑA: actualiza badge y carrito en todas las pestañas
window.addEventListener("storage", function(e) {
  if (e.key === "carrito") {
    actualizarBadgeCarrito();
    if (typeof renderCarrito === "function") renderCarrito();
  }
});

// ===== PRODUCTO DETALLE Y RELACIONADOS =====
function renderDetalleProducto() {
  function getParam(name) {
    return new URL(window.location.href).searchParams.get(name);
  }
  const cod = getParam("cod");
  if (!cod || typeof PRODUCTOS === "undefined") return;
  const prod = PRODUCTOS.find(p => p.cod === cod);
  if (!prod) return;
  $("#main-img").src = getImgPath(prod.img);
  $("#main-img").alt = prod.nombre;
  $("#product-title").textContent = prod.nombre;
  $("#product-price").textContent = formateaCLP(prod.precio);
  $("#product-desc").textContent = prod.desc;
  if ($("#add-to-cart")) {
    $("#add-to-cart").onclick = function() {
      const qty = parseInt($("#qty").value) || 1;
      for (let i = 0; i < qty; i++) agregarAlCarrito(prod.cod);
      actualizarBadgeCarrito();
    };
  }
  let relacionados = PRODUCTOS.filter(p => p.cat === prod.cat && p.cod !== prod.cod);
  if (relacionados.length < 4) {
    relacionados = [
      ...relacionados,
      ...PRODUCTOS.filter(p => p.cod !== prod.cod && !relacionados.includes(p))
    ].slice(0, 4);
  }
  $("#related-products").innerHTML = relacionados.length > 0
    ? relacionados.map(p => `
      <div class="col-sm-6 col-lg-3">
        <a href="product.html?cod=${p.cod}" class="text-decoration-none">
          <div class="card bg-secondary text-light h-100 product-card border border-primary">
            <img src="${getImgPath(p.img)}" class="card-img-top" alt="${p.nombre}">
            <div class="card-body text-center">
              <span class="d-block fw-bold font-orbitron">${p.nombre}</span>
              <span class="d-block">${formateaCLP(p.precio)}</span>
            </div>
          </div>
        </a>
      </div>
    `).join('')
    : "<div class='text-secondary'>No hay productos relacionados.</div>";
  actualizarBadgeCarrito();
}

// ===== INICIALIZACIONES EN TODAS LAS PÁGINAS =====
document.addEventListener("DOMContentLoaded", function() {
  cargarUsuarioDesdeLocalStorage();
  cargarCarrito();
  actualizarBadgeCarrito();
  if (typeof renderCarrito === "function") renderCarrito();
  renderCatalogo();
  renderIndexCatalogo();
  initFiltros();
  ["busqueda", "filtro-categoria", "filtro-min", "filtro-max"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", renderCatalogo);
  });
});

// ===== CATÁLOGOS =====
function renderCatalogo(){
  const cont = document.getElementById("productos-lista");
  if (!cont) return;
  cont.innerHTML = PRODUCTOS
    .map(p => `
      <div class="col-sm-6 col-md-4 col-lg-3">
        <div class="card bg-secondary text-light h-100 product-card">
          <img src="../img/${p.img}" class="card-img-top" alt="${p.nombre}">
          <div class="card-body d-flex flex-column">
            <h5 class="card-title">${p.nombre}</h5>
            <span class="badge bg-primary mb-2">${p.cat}</span>
            <p class="precio fw-bold mb-2">${formateaCLP(p.precio)}</p>
            <div class="mt-auto d-grid gap-2">
              <button class="btn btn-success" onclick="agregarAlCarrito('${p.cod}')">Agregar</button>
              <a class="btn btn-outline-light" href="product.html?cod=${p.cod}">Detalles</a>
            </div>
          </div>
        </div>
      </div>
    `).join('');
}

function renderIndexCatalogo() {
  const cont = document.getElementById("grid-productos");
  if (!cont) return;
  cont.innerHTML = PRODUCTOS
    .map(p => `
      <div class="col-sm-6 col-md-4 col-lg-3">
        <div class="card bg-secondary text-light h-100 product-card">
          <img src="assets/img/${p.img}" class="card-img-top" alt="${p.nombre}">
          <div class="card-body d-flex flex-column justify-content-center align-items-center">
            <span class="badge bg-primary mb-2">${p.cat}</span>
            <span class="d-block fw-bold font-orbitron">${p.nombre}</span>
            <span class="d-block">${formateaCLP(p.precio)}</span>
            <a class="btn btn-outline-light mt-2" href="assets/page/product.html?cod=${p.cod}">Ver más</a>
          </div>
        </div>
      </div>
    `).join('');
}

// ===== PERFIL DE USUARIO =====
function renderPerfilUsuario() {
  if (!document.getElementById("perfil-nombre")) return;
  $("#perfil-nombre").textContent = estado.usuario.nombre;
  $("#perfil-correo").textContent = estado.usuario.correo;
  $("#perfil-nivel").textContent = estado.usuario.nivel;
  $("#perfil-puntos").textContent = estado.usuario.puntos;
  $("#perfil-duoc-descuento").textContent =
    estado.usuario.correo && estado.usuario.correo.endsWith("@duocuc.cl") ? "Sí, 20%" : "No";
  // Header nombre en perfil
  const headerNombre = document.getElementById("header-nombre-usuario");
  if (headerNombre) headerNombre.textContent = estado.usuario.nombre;
}

// ===== FILTROS CATÁLOGO =====
function coincideProducto(p, q, cat, min, max) {
  const texto = (q || "").trim().toLowerCase();
  if (texto && !(
    p.nombre?.toLowerCase().includes(texto) ||
    p.desc?.toLowerCase().includes(texto)
  )) return false;
  if (cat && p.cat !== cat) return false;
  if (!isNaN(min) && min && p.precio < min) return false;
  if (!isNaN(max) && max && p.precio > max) return false;
  return true;
}
function cardProducto(p) {
  return `
    <div class="col-sm-6 col-md-4 col-lg-3">
      <div class="card bg-secondary text-light h-100 product-card">
        <img src="../img/${p.img}" class="card-img-top" alt="${p.nombre}">
        <div class="card-body d-flex flex-column">
          <h5 class="card-title">${p.nombre}</h5>
          <span class="badge bg-primary mb-2">${p.cat}</span>
          <p class="precio fw-bold mb-2">${formateaCLP(p.precio)}</p>
          <div class="mt-auto d-grid gap-2">
            <button class="btn btn-success" onclick="agregarAlCarrito('${p.cod}')">Agregar</button>
            <a class="btn btn-outline-light" href="product.html?cod=${p.cod}">Detalles</a>
          </div>
        </div>
      </div>
    </div>
  `;
}
function renderCatalogoFiltrado(){
  const q = document.getElementById("busqueda")?.value || "";
  const cat = document.getElementById("filtro-categoria")?.value || "";
  const min = parseInt(document.getElementById("filtro-min")?.value) || NaN;
  const max = parseInt(document.getElementById("filtro-max")?.value) || NaN;
  const cont = document.getElementById("productos-lista");
  if (!cont) return;
  const filtrados = PRODUCTOS.filter(p => coincideProducto(p, q, cat, min, max));
  cont.innerHTML = filtrados.length
    ? filtrados.map(cardProducto).join("")
    : `<div class="text-center text-muted">Sin resultados</div>`;
}
function initFiltros(){
  const sel = document.getElementById("filtro-categoria");
  if (!sel) return;
  if(sel.options.length > 1) return;
  CATEGORIAS.forEach(c=>{
    const opt = document.createElement("option");
    opt.value = c; opt.textContent = c; sel.appendChild(opt);
  });
}
function limpiarFiltros(){
  if(document.getElementById("busqueda")) document.getElementById("busqueda").value = "";
  if(document.getElementById("filtro-categoria")) document.getElementById("filtro-categoria").value = "";
  if(document.getElementById("filtro-min")) document.getElementById("filtro-min").value = "";
  if(document.getElementById("filtro-max")) document.getElementById("filtro-max").value = "";
  renderCatalogoFiltrado();
}

// ===== DESCUENTO DUOC =====
function actualizarTotales() {
  const subtotal = estado.carrito.reduce((a, i) => a + i.precio * i.qty, 0);
  let descuento = 0, esDuoc = false;
  if (
    estado.usuario.correo &&
    estado.usuario.correo.trim().toLowerCase().endsWith("@duocuc.cl")
  ) {
    descuento = subtotal * 0.20;
    esDuoc = true;
  }
  const descDiv = document.getElementById("descuento");
  if (descDiv)
    descDiv.innerHTML = esDuoc
      ? `<span>Descuento DuocUC: -${formateaCLP(descuento)} (20%)</span>`
      : "";
  const duocDiv = document.getElementById("duoc-validacion");
  if (duocDiv) {
    duocDiv.innerHTML = esDuoc
      ? `<span class="badge bg-success"><i class="bi bi-patch-check"></i> Usuario DuocUC verificado. ¡20% de descuento aplicado!</span>`
      : `<span class="badge bg-danger"><i class="bi bi-x-circle"></i> No eres usuario DuocUC. ¿Tienes correo @duocuc.cl?</span>`;
  }
  const totalFinal = subtotal - descuento;
  if (document.getElementById("total"))
    document.getElementById("total").textContent = formateaCLP(totalFinal);
}

// ===== CHECKOUT =====
function checkout() {
  cargarCarrito();
  if (estado.carrito.length === 0) {
    alert("Tu carrito está vacío.");
    return;
  }
  alert("🎉 ¡Muchas gracias por comprar en nuestra página!\n\nTe esperamos nuevamente en Level-Up Gamer.");
  estado.carrito = [];
  guardarCarrito();
  renderCarrito();
  actualizarBadgeCarrito();
}

// ===== LOGIN USUARIO =====
function iniciarLogin() {
  const form = document.getElementById("loginForm");
  if (!form) return;
  form.addEventListener("submit", function(e){
    e.preventDefault();

    const correo = document.getElementById("correo").value.trim();
    const contrasena = document.getElementById("contrasena").value.trim();

    let valido = true;
    if (!correo) {
      document.getElementById("correoError").textContent = "Ingresa tu correo";
      document.getElementById("correo").classList.add("is-invalid");
      valido = false;
    } else {
      document.getElementById("correoError").textContent = "";
      document.getElementById("correo").classList.remove("is-invalid");
    }
    if (!contrasena) {
      document.getElementById("contrasenaError").textContent = "Ingresa tu contraseña";
      document.getElementById("contrasena").classList.add("is-invalid");
      valido = false;
    } else {
      document.getElementById("contrasenaError").textContent = "";
      document.getElementById("contrasena").classList.remove("is-invalid");
    }
    if (!valido) return;

    // Simula usuario (ajusta si tienes datos reales)
    const usuario = {
      nombre: correo.split("@")[0],
      correo: correo,
      nacimiento: "",
      referido: "",
      esDuoc: correo.toLowerCase().endsWith("@duocuc.cl"),
      puntos: 0,
      nivel: "Bronce"
    };

    guardarUsuarioEnLocalStorage(usuario);

    // Mensaje de éxito
    alert("¡Inicio de sesión exitoso!");

    // Redirige al index
    window.location.href = "../../index.html";
  });
}
document.addEventListener("DOMContentLoaded", function() {
  iniciarLogin();
});
