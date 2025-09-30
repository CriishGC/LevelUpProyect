// Datos mockup de productos
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

function formateaCLP(n){ return n.toLocaleString("es-CL")+" CLP"; }

// Muestra catálogo en página de catálogo (catalogo.html)
function renderCatalogoMockup(){
  const cont = document.getElementById("productos-lista");
  if (!cont) return;
  cont.innerHTML = PRODUCTOS
    .map(p => `
      <div class="col-sm-6 col-md-4 col-lg-3 mb-3">
        <div class="card bg-secondary text-light h-100 product-card">
          <img src="../img/${p.img}" class="card-img-top" alt="${p.nombre}">
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
  cont.innerHTML = PRODUCTOS
    .map(p => `
      <div class="col-sm-6 col-md-4 col-lg-3 mb-3">
        <div class="card bg-secondary text-light h-100 product-card">
          <img src="assets/img/${p.img}" class="card-img-top" alt="${p.nombre}">
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
function renderDetalleProducto() {
  const params = new URLSearchParams(window.location.search);
  const cod = params.get("cod");
  const prod = PRODUCTOS.find(p => p.cod === cod);
  if (!prod) return;

  // Rellena los elementos visuales
  const img = document.getElementById("main-img");
  if (img) {
    img.src = "../img/" + prod.img;
    img.alt = prod.nombre;
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
  let relacionados = PRODUCTOS.filter(p => p.cat === prod.cat && p.cod !== prod.cod);
  if (relacionados.length < 4) {
    relacionados = [
      ...relacionados,
      ...PRODUCTOS.filter(p => p.cod !== prod.cod && !relacionados.includes(p))
    ].slice(0, 4);
  }
  const related = document.getElementById("related-products");
  if (related) {
    related.innerHTML = relacionados.map(p => `
      <div class="col-sm-6 col-lg-3">
        <a href="product.html?cod=${p.cod}" class="text-decoration-none">
          <div class="card bg-secondary text-light h-100 product-card border border-primary">
            <img src="../img/${p.img}" class="card-img-top" alt="${p.nombre}">
            <div class="card-body text-center">
              <span class="d-block fw-bold font-orbitron">${p.nombre}</span>
              <span class="d-block">${formateaCLP(p.precio)}</span>
            </div>
          </div>
        </a>
      </div>
    `).join('');
  }
}

// Inicialización: muestra catálogo y producto según la página
document.addEventListener("DOMContentLoaded", function() {
  renderCatalogoMockup();        // catalogo.html
  renderIndexCatalogoMockup();   // index.html
  renderDetalleProducto();       // product.html
});