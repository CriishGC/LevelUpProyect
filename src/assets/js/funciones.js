/* ------------------------------
   Datos base
------------------------------ */
const CATEGORIAS = [
  "Juegos de Mesa","Accesorios","Consolas","Computadores Gamers",
  "Sillas Gamers","Mouse","Mousepad","Poleras Personalizadas","Polerones Gamers Personalizados"
];

const PRODUCTOS = [
  { cod:"JM001", cat:"Juegos de Mesa", nombre:"Catan", precio:29990, desc:"Juego de estrategia (3-4 jugadores).", img:"assets/img/catan.webp" },
  { cod:"JM002", cat:"Juegos de Mesa", nombre:"Carcassonne", precio:24990, desc:"Colocación de losetas (2-5 jugadores).", img:"assets/img/carcassonne.webp" },
  { cod:"AC001", cat:"Accesorios", nombre:"Controlador Inalámbrico Xbox Series X", precio:59990, desc:"Botones mapeables y gran ergonomía.", img:"assets/img/xbox_controller.webp" },
  { cod:"AC002", cat:"Accesorios", nombre:"Auriculares HyperX Cloud II", precio:79990, desc:"Sonido envolvente y mic desmontable.", img:"assets/img/hyperx_cloud_ii.webp" },
  { cod:"CO001", cat:"Consolas", nombre:"PlayStation 5", precio:549990, desc:"Next-gen con SSD ultrarrápido.", img:"assets/img/ps5.webp" },
  { cod:"CG001", cat:"Computadores Gamers", nombre:"PC Gamer ASUS ROG Strix", precio:1299990, desc:"Rendimiento de alto nivel.", img:"assets/img/rog_strix.webp" },
  { cod:"SG001", cat:"Sillas Gamers", nombre:"Secretlab Titan", precio:349990, desc:"Ergonómica y ajustable.", img:"assets/img/secretlab_titan.webp" },
  { cod:"MS001", cat:"Mouse", nombre:"Logitech G502 HERO", precio:49990, desc:"Sensor de alta precisión.", img:"assets/img/g502.webp" },
  { cod:"MP001", cat:"Mousepad", nombre:"Razer Goliathus Extended Chroma", precio:29990, desc:"Superficie amplia + RGB.", img:"assets/img/goliathus.webp" },
  { cod:"PP001", cat:"Poleras Personalizadas", nombre:"Polera 'Level-Up' Personalizada", precio:14990, desc:"Personaliza con tu gamer tag.", img:"assets/img/polera.webp" }
];

// Reseñas en memoria por código de producto
const REVIEWS = {}; // { cod: [ {nombre, rating, comentario} ] }

/* ------------------------------
   Estado de sesión (sin storage)
------------------------------ */
const estado = {
  usuario: {
    nombre: "", correo: "", nacimiento: "", referido: "",
    esDuoc: false, puntos: 0, nivel: "Bronce"
  },
  carrito: [] // [{cod,nombre,precio,qty}]
};

/* ------------------------------
   Utilidades
------------------------------ */
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

/* ------------------------------
   SPA: navegación de secciones
------------------------------ */
function mostrarSeccion(id){
  $$(".seccion").forEach(s=>s.classList.remove("activo"));
  const target = $("#"+id) || $("#home");
  target.classList.add("activo");
  if(id==="catalogo") renderCatalogo();
  if(id==="carrito")  renderCarrito();
  if(id==="perfil")   pintarEstadoPerfil();
}

/* ------------------------------
   Catálogo + filtros
------------------------------ */
function initFiltros(){
  const sel=$("#filtro-categoria");
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
  const codShare = encodeURIComponent(`${p.nombre} en Level-Up Gamer`);
  const urlShare = encodeURIComponent("#"); // si luego tienes URL real, reemplaza
  return `
  <div class="col-sm-6 col-md-4 col-lg-3">
    <div class="card bg-secondary text-light h-100 product-card">
      <img src="${p.img}" class="card-img-top" alt="${p.nombre}" onerror="this.src='assets/img/placeholder.webp'">
      <div class="card-body d-flex flex-column">
        <h5 class="card-title">${p.nombre}</h5>
        <span class="badge bg-primary mb-2">${p.cat}</span>
        <p class="card-text">${p.desc}</p>
        <p class="precio fw-bold mb-2">${formateaCLP(p.precio)}</p>
        <div class="mt-auto d-grid gap-2">
          <button class="btn btn-success" onclick="agregarAlCarrito('${p.cod}')">Agregar</button>
          <button class="btn btn-outline-light" onclick="abrirModalProducto('${p.cod}')">Detalles / Reseñas</button>
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

function renderCatalogo(){
  const q=$("#busqueda")?.value||"";
  const cat=$("#filtro-categoria")?.value||"";
  const min=parseInt($("#filtro-min")?.value||"");
  const max=parseInt($("#filtro-max")?.value||"");
  const cont=$("#grid-productos");
  cont.innerHTML = PRODUCTOS
    .filter(p=>coincideProducto(p,q,cat,min,max))
    .map(p=>cardProducto(p))
    .join("") || `<div class="text-center text-muted">Sin resultados</div>`;
}

function limpiarFiltros(){
  $("#busqueda").value="";
  $("#filtro-categoria").value="";
  $("#filtro-min").value="";
  $("#filtro-max").value="";
  renderCatalogo();
}

/* ------------------------------
   Carrito
------------------------------ */
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
  $("#badge-carrito").textContent = totalUnidades;
}

function renderCarrito(){
  const list=$("#carrito-lista");
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

  // Canje puntos (10 puntos = 100 CLP por ejemplo)
  const rate = 10; // 10 pts -> 100 CLP
  const factor = 10; // pasos de 10
  const disponibles = estado.usuario.puntos;
  $("#puntos-disponibles").textContent = disponibles;

  let canje = parseInt($("#canje-puntos").value||0);
  if(isNaN(canje) || canje<0) canje = 0;
  canje = Math.min(canje - (canje%factor), disponibles); // múltiplos de 10
  $("#canje-puntos").value = canje;

  const descuentoPuntos = (canje/rate)*100; // 10 pts = 100 CLP
  const total = Math.max(0, subtotal - desc - descuentoPuntos);

  $("#subtotal").textContent = formateaCLP(subtotal);
  $("#descuento").textContent = formateaCLP(desc);
  $("#linea-descuento").style.display = esDuoc && subtotal>0 ? "block":"none";
  $("#total").textContent = formateaCLP(total);
}

function checkout(){
  if(estado.carrito.length===0){ alert("Tu carrito está vacío."); return; }
  // Consumir puntos canjeados
  const canje = parseInt($("#canje-puntos").value||0) || 0;
  estado.usuario.puntos = Math.max(0, estado.usuario.puntos - canje);

  // Sumar puntos por compra (1 punto por cada $1.000 CLP de subtotal)
  const subtotal = estado.carrito.reduce((a,i)=>a+i.precio*i.qty,0);
  const puntosGanados = Math.floor(subtotal / 1000);
  estado.usuario.puntos += puntosGanados;
  estado.usuario.nivel = calcularNivel(estado.usuario.puntos);

  // Vaciar carrito
  estado.carrito = [];
  actualizarBadgeCarrito();
  renderCarrito();
  pintarEstadoPerfil();

  alert(`Compra realizada 🎉\nGanaste ${puntosGanados} puntos LevelUp.`);
}

/* ------------------------------
   Perfil / Registro
------------------------------ */
function guardarPerfil(){
  const nombre = $("#perfil-nombre").value.trim();
  const correo = $("#perfil-correo").value.trim();
  const nacimiento = $("#perfil-nacimiento").value;
  const referido = $("#perfil-referido").value.trim();

  const alerta = $("#alerta-perfil");
  alerta.classList.add("d-none");

  if(!nombre || !correo || !nacimiento){
    alerta.className = "alert alert-warning mt-3";
    alerta.textContent = "Completa nombre, correo y fecha de nacimiento.";
    return;
  }

  // Validar +18
  if(edadDesde(nacimiento) < 18){
    alerta.className = "alert alert-danger mt-3";
    alerta.textContent = "Debes ser mayor de 18 años para registrarte.";
    return;
  }

  // Marcar beneficio DUOC
  const esDuoc = /@duoc\.cl$/i.test(correo);

  // Puntos por referido simple (si ingresó un código válido, suma 25)
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

  alerta.className = "alert alert-success mt-3";
  alerta.innerHTML = `Datos guardados. ${esDuoc ? "Descuento DUOC 20% activo. " : ""}${puntosExtra?`+${puntosExtra} Puntos por referido.`:""}`;

  pintarEstadoPerfil();
  refrescarBeneficios();
}

function pintarEstadoPerfil(){
  $("#estado-duoc").textContent = estado.usuario.esDuoc ? "Sí (20%)" : "No";
  $("#perfil-puntos").textContent = estado.usuario.puntos;
  $("#perfil-nivel").textContent = estado.usuario.nivel;
}

function refrescarBeneficios(){
  // Reflejar descuento DUOC en el carrito si está activo
  actualizarTotales();
}

/* ------------------------------
   Modal Producto (detalles + reseñas)
------------------------------ */
function abrirModalProducto(cod){
  const p = PRODUCTOS.find(x=>x.cod===cod);
  if(!p) return;
  const id = "modal-"+cod;
  let modal = document.getElementById(id);
  if(!modal){
    modal = document.createElement("div");
    modal.id = id;
    modal.className = "modal fade";
    modal.tabIndex = -1;
    modal.innerHTML = `
      <div class="modal-dialog modal-lg modal-dialog-scrollable">
        <div class="modal-content bg-dark text-light">
          <div class="modal-header">
            <h5 class="modal-title">${p.nombre}</h5>
            <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body">
            <div class="row g-3">
              <div class="col-md-5">
                <img src="${p.img}" class="img-fluid rounded" alt="${p.nombre}" onerror="this.src='assets/img/placeholder.webp'">
              </div>
              <div class="col-md-7">
                <span class="badge bg-primary">${p.cat}</span>
                <p class="mt-2">${p.desc}</p>
                <p class="fw-bold">${formateaCLP(p.precio)}</p>
                <button class="btn btn-success mb-3" onclick="agregarAlCarrito('${p.cod}')">Agregar al carrito</button>

                <h6 class="mt-3">Reseñas</h6>
                <div id="reviews-${p.cod}" class="mb-3"></div>

                <div class="card bg-secondary">
                  <div class="card-body">
                    <div class="row g-2">
                      <div class="col-md-4">
                        <input id="rv-nombre-${p.cod}" class="form-control" placeholder="Tu nombre">
                      </div>
                      <div class="col-md-3">
                        <select id="rv-rating-${p.cod}" class="form-select">
                          <option value="5">5 ★</option>
                          <option value="4">4 ★</option>
                          <option value="3">3 ★</option>
                          <option value="2">2 ★</option>
                          <option value="1">1 ★</option>
                        </select>
                      </div>
                      <div class="col-md-12">
                        <textarea id="rv-com-${p.cod}" class="form-control" placeholder="Escribe tu reseña..."></textarea>
                      </div>
                      <div class="col-md-12">
                        <button class="btn btn-outline-light" onclick="guardarReview('${p.cod}')">Publicar reseña</button>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </div>`;
    document.body.appendChild(modal);
  }
  pintarReviews(cod);
  const bs = new bootstrap.Modal(modal);
  bs.show();
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

/* ------------------------------
   Inicio
------------------------------ */
document.addEventListener("DOMContentLoaded", ()=>{
  initFiltros();
  renderCatalogo();
  mostrarSeccion("home");
});
