const CATEGORIAS = [
  "Juegos de Mesa","Accesorios","Consolas","Computadores Gamers",
  "Sillas Gamers","Mouse","Mousepad","Poleras Personalizadas","Polerones Gamers Personalizados"
];

const PRODUCTOS = [
  { cod:"JM001", cat:"Juegos de Mesa", nombre:"Catan", precio:29990, desc:"Juego de estrategia (3-4 jugadores).", img:"catan2.jpg" },
  { cod:"JM002", cat:"Juegos de Mesa", nombre:"Carcassonne", precio:24990, desc:"Colocación de losetas (2-5 jugadores).", img:"carcassonne.jpg" },
  { cod:"AC001", cat:"Accesorios", nombre:"Controlador Inalámbrico Xbox Series X", precio:59990, desc:"Botones mapeables y gran ergonomía.", img:"xbox_controller.webp" },
  { cod:"AC002", cat:"Accesorios", nombre:"Auriculares HyperX Cloud II", precio:79990, desc:"Sonido envolvente y mic desmontable.", img:"hyperx_cloud_ii_red_1_main.webp" },
  { cod:"CO001", cat:"Consolas", nombre:"PlayStation 5", precio:549990, desc:"Next-gen con SSD ultrarrápido.", img:"ps5.webp" },
  { cod:"CG001", cat:"Computadores Gamers", nombre:"PC Gamer ASUS ROG Strix", precio:1299990, desc:"Rendimiento de alto nivel.", img:"rog_strix.jpg" },
  { cod:"SG001", cat:"Sillas Gamers", nombre:"Secretlab Titan", precio:349990, desc:"Ergonómica y ajustable.", img:"sillageimer.jpg" },
  { cod:"MS001", cat:"Mouse", nombre:"Logitech G502 HERO", precio:49990, desc:"Sensor de alta precisión.", img:"g502-heroe.jpg" },
  { cod:"MP001", cat:"Mousepad", nombre:"Razer Goliathus Extended Chroma", precio:29990, desc:"Superficie amplia + RGB.", img:"mauspad.jpg" },
  { cod:"PP001", cat:"Poleras Personalizadas", nombre:"Polera 'Level-Up' Personalizada", precio:14990, desc:"Personaliza con tu gamer tag.", img:"poleraLevel.png" },
  { cod:"CG002", cat:"Computadores Gamers", nombre:"Pc Gamer", precio:1199990, desc:"Rendimiento de alto nivel en juegos y edicion 3D", img:"pcGamertarro.jpg" },
  { cod:"negr0", cat:"Negroni", nombre:"Jonathan lillo", precio:9999990, desc:"Rendimiento espectacular en tareas fisicas.", img:"negrito.jpeg" }
  
];

// === UTILS ===
function formateaCLP(n){ return n.toLocaleString("es-CL")+" CLP"; }
function getImgPath(filename) { return "../img/" + filename; }

// === CARGA DE PRODUCTO Y RELACIONADOS ===
document.addEventListener("DOMContentLoaded", function() {
  // Obtener parámetro cod
  function getParam(name) {
    return new URL(window.location.href).searchParams.get(name);
  }
  const cod = getParam("cod");
  if (!cod) return; // No hay código en la URL

  // Buscar el producto principal
  const prod = PRODUCTOS.find(p => p.cod === cod);
  if (!prod) {
    document.getElementById("product-title").textContent = "Producto no encontrado";
    document.getElementById("product-desc").textContent = "";
    document.getElementById("main-img").src = "";
    document.getElementById("product-price").textContent = "";
    document.getElementById("related-products").innerHTML = "<div class='text-secondary'>No hay productos relacionados.</div>";
    return;
  }

  // Mostrar datos del producto principal
  document.getElementById("main-img").src = getImgPath(prod.img);
  document.getElementById("main-img").alt = prod.nombre;
  document.getElementById("product-title").textContent = prod.nombre;
  document.getElementById("product-price").textContent = formateaCLP(prod.precio);
  document.getElementById("product-desc").textContent = prod.desc;

  // Mostrar productos relacionados
  let relacionados = PRODUCTOS.filter(p => p.cat === prod.cat && p.cod !== prod.cod);
  // Si hay menos de 4, rellenar con otros productos
  if (relacionados.length < 4) {
    relacionados = [
      ...relacionados,
      ...PRODUCTOS.filter(p => p.cod !== prod.cod && !relacionados.includes(p))
    ].slice(0, 4);
  }
  document.getElementById("related-products").innerHTML = relacionados.length > 0
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
});

function getImgPath(filename) {
  if (window.location.pathname.includes('assets/page/') || window.location.pathname.includes('/page/')) {
    return '../img/' + filename;
  }
  return 'assets/img/' + filename;
}

const REVIEWS = {}; // { cod: [ {nombre, rating, comentario} ] }
const estado = {
  usuario: {
    nombre: "", correo: "", nacimiento: "", referido: "",
    esDuoc: false, puntos: 0, nivel: "Bronce"
  },
  carrito: [] // [{cod,nombre,precio,qty}]
};

const $ = (sel)=>document.querySelector(sel);
const $$ = (sel)=>document.querySelectorAll(sel);

function formateaCLP(n){ return n.toLocaleString("es-CL")+" CLP"; }
function edadDesde(fechaStr){
  if(!fechaStr) return 0;
  const hoy=new Date(), f=new Date(fechaStr);
  let e=hoy.getFullYear()-f.getFullYear();
  const m=hoy.getMonth()-f.getMonth();
  if(m<0 || (m===0 && hoy.getDate()<f.getDate())) e--;
  return e;
}
function calcularNivel(puntos){
  if(puntos>=500) return "Diamante";
  if(puntos>=250) return "Platino";
  if(puntos>=150) return "Oro";
  if(puntos>=75)  return "Plata";
  return "Bronce";
}

function mostrarSeccion(id){
  $$(".seccion").forEach(s=>s.classList.remove("activo"));
  const target = $("#"+id) || $("#home");
  target.classList.add("activo");
  if(id==="catalogo") renderCatalogo();
  if(id==="carrito")  renderCarrito();
  if(id==="perfil")   pintarEstadoPerfil();
}

function initFiltros(){
  const sel=$("#filtro-categoria");
  if (!sel) return;
  if(sel.options.length > 1) return;
  CATEGORIAS.forEach(c=>{
    const opt=document.createElement("option");
    opt.value=c; opt.textContent=c; sel.appendChild(opt);
  });
}

function coincideProducto(p, q, cat, min, max){
  const matchTexto = !q || (p.nombre+" "+p.desc).toLowerCase().includes(q.toLowerCase());
  const matchCat = !cat || p.cat===cat;
  const matchMin = !min || p.precio>=min;
  const matchMax = !max || p.precio<=max;
  return matchTexto && matchCat && matchMin && matchMax;
}

function cardProducto(p){
  const imgPath = getImgPath(p.img);
  const codShare = encodeURIComponent(`${p.nombre} en Level-Up Gamer`);
  const urlShare = encodeURIComponent("#");
  return `
  <div class="col-sm-6 col-md-4 col-lg-3">
    <div class="card bg-secondary text-light h-100 product-card">
      <img src="${imgPath}" class="card-img-top" alt="${p.nombre}" onerror="this.src='${imgPath.replace(p.img,'placeholder.webp')}'">
      <div class="card-body d-flex flex-column">
        <h5 class="card-title">${p.nombre}</h5>
        <span class="badge bg-primary mb-2">${p.cat}</span>
        <p class="card-text">${p.desc}</p>
        <p class="precio fw-bold mb-2">${formateaCLP(p.precio)}</p>
        <div class="mt-auto d-grid gap-2">
          <button class="btn btn-success" onclick="agregarAlCarrito('${p.cod}')">Agregar</button>
          <a class="btn btn-outline-light" href="product.html?cod=${p.cod}">Detalles / Reseñas</a>
          <div class="d-flex gap-2 justify-content-center">
            <a class="btn btn-sm btn-outline-light" target="_blank" rel="noopener"
               href="https://www.facebook.com/sharer/sharer.php?u=${urlShare}&quote=${codShare}">Facebook</a>
            <a class="btn btn-sm btn-outline-light" target="_blank" rel="noopener"
               href="https://twitter.com/intent/tweet?text=${codShare}&url=${urlShare}">X</a>
          </div>
        </div>
      </div>
    </div>
  </div>`;
}
function cardProductoSimple(p){
  const imgPath = getImgPath(p.img);
  return `
    <div class="col-sm-6 col-md-4 col-lg-3">
      <div class="card bg-secondary text-light h-100 product-card">
        <img src="${imgPath}" class="card-img-top" alt="${p.nombre}" onerror="this.src='${imgPath.replace(p.img,'placeholder.webp')}'">
        <div class="card-body d-flex flex-column justify-content-center align-items-center">
          <span class="badge bg-primary mb-2">${p.cat}</span>
        </div>
      </div>
    </div>`;
}

// Solo para el index.html
document.addEventListener("DOMContentLoaded", function() {
  // Solo ejecuta en el index
  if (window.location.pathname.endsWith("index.html") || window.location.pathname === "/") {
    const cont = document.getElementById("grid-productos");
    if (!cont) return;
    cont.innerHTML = PRODUCTOS.map(p => cardProductoSimple(p)).join("");
  }
});

function renderCatalogo(){
  const q=$("#busqueda")?.value||"";
  const cat=$("#filtro-categoria")?.value||"";
  const min=parseInt($("#filtro-min")?.value||"");
  const max=parseInt($("#filtro-max")?.value||"");
  const cont=$("#grid-productos") || $("#productos-lista");
  if (!cont) return;
  cont.innerHTML = PRODUCTOS
    .filter(p=>coincideProducto(p,q,cat,min,max))
    .map(p=>cardProducto(p))
    .join("") || `<div class="text-center text-muted">Sin resultados</div>`;
}

function limpiarFiltros(){
  if($("#busqueda")) $("#busqueda").value="";
  if($("#filtro-categoria")) $("#filtro-categoria").value="";
  if($("#filtro-min")) $("#filtro-min").value="";
  if($("#filtro-max")) $("#filtro-max").value="";
  renderCatalogo();
}

function agregarAlCarrito(cod){
  const prod = PRODUCTOS.find(p=>p.cod===cod);
  if(!prod) return;
  const item = estado.carrito.find(i=>i.cod===cod);
  if(item) item.qty++;
  else estado.carrito.push({ cod: prod.cod, nombre: prod.nombre, precio: prod.precio, qty: 1 });
  actualizarBadgeCarrito();
  renderCarrito();
  mostrarSeccion("carrito");
}

function quitarDelCarrito(idx){
  estado.carrito.splice(idx,1);
  actualizarBadgeCarrito();
  renderCarrito();
}

function cambiarQty(idx, delta){
  const it = estado.carrito[idx];
  if(!it) return;
  it.qty = Math.max(1, it.qty + delta);
  renderCarrito();
}

function actualizarBadgeCarrito(){
  const totalUnidades = estado.carrito.reduce((a,i)=>a+i.qty,0);
  const badge = $("#badge-carrito");
  if (badge) badge.textContent = totalUnidades;
}

function renderCarrito(){
  const list=$("#carrito-lista");
  if(!list) return;
  if(estado.carrito.length===0){
    list.innerHTML = `<div class="list-group-item bg-dark text-light">Tu carrito está vacío.</div>`;
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
  }
  actualizarTotales();
}

function actualizarTotales(){
  const subtotal = estado.carrito.reduce((a,i)=>a+i.precio*i.qty,0);
  const esDuoc = estado.usuario.esDuoc;
  const desc = esDuoc ? Math.round(subtotal*0.20) : 0;

  const rate = 10;
  const factor = 10;
  const disponibles = estado.usuario.puntos;
  if ($("#puntos-disponibles")) $("#puntos-disponibles").textContent = disponibles;

  let canje = parseInt($("#canje-puntos")?.value||0);
  if(isNaN(canje) || canje<0) canje = 0;
  canje = Math.min(canje - (canje%factor), disponibles);
  if ($("#canje-puntos")) $("#canje-puntos").value = canje;

  const descuentoPuntos = (canje/rate)*100;
  const total = Math.max(0, subtotal - desc - descuentoPuntos);

  if ($("#subtotal")) $("#subtotal").textContent = formateaCLP(subtotal);
  if ($("#descuento")) $("#descuento").textContent = formateaCLP(desc);
  if ($("#linea-descuento")) $("#linea-descuento").style.display = esDuoc && subtotal>0 ? "block":"none";
  if ($("#total")) $("#total").textContent = formateaCLP(total);
}

function checkout(){
  if(estado.carrito.length===0){ alert("Tu carrito está vacío."); return; }
  const canje = parseInt($("#canje-puntos")?.value||0) || 0;
  estado.usuario.puntos = Math.max(0, estado.usuario.puntos - canje);

  const subtotal = estado.carrito.reduce((a,i)=>a+i.precio*i.qty,0);
  const puntosGanados = Math.floor(subtotal / 1000);
  estado.usuario.puntos += puntosGanados;
  estado.usuario.nivel = calcularNivel(estado.usuario.puntos);

  estado.carrito = [];
  actualizarBadgeCarrito();
  renderCarrito();
  pintarEstadoPerfil();

  alert(`Compra realizada 🎉\nGanaste ${puntosGanados} puntos LevelUp.`);
}

function guardarPerfil(){
  const nombre = $("#perfil-nombre")?.value.trim();
  const correo = $("#perfil-correo")?.value.trim();
  const nacimiento = $("#perfil-nacimiento")?.value;
  const referido = $("#perfil-referido")?.value.trim();

  const alerta = $("#alerta-perfil");
  if (alerta) alerta.classList.add("d-none");

  if(!nombre || !correo || !nacimiento){
    if (alerta) {
      alerta.className = "alert alert-warning mt-3";
      alerta.textContent = "Completa nombre, correo y fecha de nacimiento.";
    }
    return;
  }

  if(edadDesde(nacimiento) < 18){
    if (alerta) {
      alerta.className = "alert alert-danger mt-3";
      alerta.textContent = "Debes ser mayor de 18 años para registrarte.";
    }
    return;
  }

  const esDuoc = /@duoc\.cl$/i.test(correo);

  let puntosExtra = 0;
  if(referido){
    puntosExtra = 25;
    estado.usuario.puntos += puntosExtra;
  }

  estado.usuario = {
    ...estado.usuario,
    nombre, correo, nacimiento, referido, esDuoc,
    nivel: calcularNivel(estado.usuario.puntos)
  };

  if (alerta) {
    alerta.className = "alert alert-success mt-3";
    alerta.innerHTML = `Datos guardados. ${esDuoc ? "Descuento DUOC 20% activo. " : ""}${puntosExtra?`+${puntosExtra} Puntos por referido.`:""}`;
  }

  pintarEstadoPerfil();
  refrescarBeneficios();
}

function pintarEstadoPerfil(){
  if ($("#estado-duoc")) $("#estado-duoc").textContent = estado.usuario.esDuoc ? "Sí (20%)" : "No";
  if ($("#perfil-puntos")) $("#perfil-puntos").textContent = estado.usuario.puntos;
  if ($("#perfil-nivel")) $("#perfil-nivel").textContent = estado.usuario.nivel;
}

function refrescarBeneficios(){
  actualizarTotales();
}

function guardarReview(cod){
  const nombre = $(`#rv-nombre-${cod}`).value.trim() || "Anónimo";
  const rating = parseInt($(`#rv-rating-${cod}`).value||"5");
  const comentario = $(`#rv-com-${cod}`).value.trim();
  if(!comentario){ alert("Escribe un comentario."); return; }
  REVIEWS[cod] ??= [];
  REVIEWS[cod].push({nombre, rating, comentario});
  $(`#rv-com-${cod}`).value = "";
  pintarReviews(cod);
}

function pintarReviews(cod){
  const cont = $(`#reviews-${cod}`);
  const lista = REVIEWS[cod]||[];
  if(!cont) return;
  cont.innerHTML = lista.length
    ? lista.map(r=>`<div class="review"><strong>${r.nombre}</strong> — ${"★".repeat(r.rating)}<br>${r.comentario}</div>`).join("")
    : `<div class="text-muted">Aún no hay reseñas.</div>`;
}

document.addEventListener("DOMContentLoaded", function() {
  initFiltros();
  renderCatalogo();
  mostrarSeccion("home");

  function getParam(name) {
    const url = new URL(window.location.href);
    return url.searchParams.get(name);
  }
  const cod = getParam("cod");
  if (cod) {
    const prod = PRODUCTOS.find(p => p.cod === cod);
    if (!prod) return;
    if ($("#breadcrumb-cat")) $("#breadcrumb-cat").textContent = prod.cat;
    if ($("#breadcrumb-title")) $("#breadcrumb-title").textContent = prod.nombre;
    if ($("#main-img")) $("#main-img").src = getImgPath(prod.img);
    if ($("#product-title")) $("#product-title").textContent = prod.nombre;
    if ($("#product-price")) $("#product-price").textContent = formateaCLP(prod.precio);
    if ($("#product-desc")) $("#product-desc").textContent = prod.desc;
    if ($("#miniaturas")) $("#miniaturas").innerHTML = `<img src="${getImgPath(prod.img)}" class="img-thumbnail border border-primary" style="width:60px; height:60px; object-fit:cover;">`;

    if ($("#add-to-cart")) {
      $("#add-to-cart").onclick = function() {
        const qty = parseInt($("#qty").value) || 1;
        for (let i = 0; i < qty; i++) agregarAlCarrito(prod.cod);
      };
    }

    function pintarReviewsProducto() {
      const cont = $("#reviews-product");
      const lista = REVIEWS[cod]||[];
      if(!cont) return;
      cont.innerHTML = lista.length
        ? lista.map(r=>
          `<div class="review mb-2">
            <strong>${r.nombre}</strong> — ${"★".repeat(r.rating)}<br>${r.comentario}
          </div>`
        ).join("")
        : `<div class="text-muted">Aún no hay reseñas.</div>`;
    }
    pintarReviewsProducto();

    if ($("#btn-review")) {
      $("#btn-review").onclick = function() {
        const nombre = $("#rv-nombre-product").value.trim() || "Anónimo";
        const rating = parseInt($("#rv-rating-product").value||"5");
        const comentario = $("#rv-com-product").value.trim();
        if(!comentario){ alert("Escribe un comentario."); return; }
        REVIEWS[cod] ??= [];
        REVIEWS[cod].push({nombre, rating, comentario});
        $("#rv-com-product").value = "";
        pintarReviewsProducto();
      };
    }

    if ($("#related-products")) {
      const relacionados = PRODUCTOS.filter(p => p.cat === prod.cat && p.cod !== prod.cod).slice(0, 4);
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
    }
  }
});

const comunas = {
  metropolitana: ["Santiago", "Puente Alto", "Maipú", "Las Condes", "La Florida", "Ñuñoa"],
  valparaiso: ["Valparaíso", "Viña del Mar", "Quilpué", "Villa Alemana", "Concón"],
  biobio: ["Concepción", "Talcahuano", "Chiguayante", "Los Ángeles", "San Pedro de la Paz"]
};

// Escuchar el cambio en el select de región
document.getElementById("region").addEventListener("change", function() {
  const comunaSelect = document.getElementById("comuna");
  const region = this.value;

  // Limpiar comunas anteriores
  comunaSelect.innerHTML = "<option value=''>Seleccione una comuna</option>";

  // Agregar comunas correspondientes
  if (region && comunas[region]) {
    comunas[region].forEach(comuna => {
      const option = document.createElement("option");
      option.value = comuna.toLowerCase().replace(/\s+/g, "-");
      option.textContent = comuna;
      comunaSelect.appendChild(option);
    });
  }
});

document.addEventListener("DOMContentLoaded", function() {
  const searchInput = document.getElementById("searchInput");
  if (!searchInput) return;

  searchInput.addEventListener("input", function() {
    const query = this.value.toLowerCase();
    // Actualiza el filtro global y vuelve a renderizar
    // Si usas un filtro adicional, puedes guardar el valor en una variable global
    window.filtroBusqueda = query;
    renderCatalogoConBusqueda(query);
  });
});

// === Buscador global en header que filtra catálogo de productos ===
document.addEventListener("DOMContentLoaded", function() {
  const searchInput = document.getElementById("searchInput");
  if (!searchInput) return;

  searchInput.addEventListener("input", function() {
    // Activa la sección catálogo al escribir
    mostrarSeccion('catalogo');
    renderCatalogo();
  });
});


document.addEventListener("DOMContentLoaded", function() {
  renderCatalogo();

  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", function() {
      renderCatalogo();
    });
  }
});

document.addEventListener("DOMContentLoaded", function() {
  initFiltros();
  renderCatalogo();
  mostrarSeccion("catalogo"); // <-- CAMBIO NECESARIO
  // resto igual...
});


