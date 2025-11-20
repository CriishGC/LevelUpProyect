import React from 'react';

// Asegúrate de importar tus estilos aquí o en App.js si no se cargan globalmente
// import '../App.css'; 

const Home = () => {
  return (
    <div className="home-container">
      {/* Header */}
      <header className="navbar-electric py-3">
        <div className="container d-flex justify-content-between align-items-center">
          <a 
            href="/" 
            className="d-flex align-items-center text-decoration-none me-3"
            onClick={(e) => {
                // Aquí iría tu lógica de navegación o mostrarSeccion('home')
                // e.preventDefault(); 
            }}
          >
            <img src="assets/img/logo.png" alt="Logo" width="80px" height="80px" className="me-2" />
            <span className="fs-4 fw-bold font-orbitron text-white">Level-Up Gamer</span>
          </a>
          <nav className="flex-grow-1">
            <ul className="nav gap-3 justify-content-center">
              <li className="nav-item"><a className="nav-link text-white" href="/">Inicio</a></li>
              <li className="nav-item"><a className="nav-link text-white" href="/catalogo">Productos</a></li>
              <li className="nav-item"><a className="nav-link text-white" href="/nosotros">Nosotros</a></li>
              <li className="nav-item"><a className="nav-link text-white" href="/blog">Blog</a></li>
              <li className="nav-item"><a className="nav-link text-white" href="/contacto">Contacto</a></li>
              <form className="d-flex" role="search" onSubmit={(e) => e.preventDefault()}>
                <input className="form-control me-2" type="search" placeholder="Buscar..." aria-label="Buscar" id="searchInput" />
                <button className="btn btn-outline-light" type="submit">
                  <i className="bi bi-search"></i>
                </button>
              </form>
            </ul>
          </nav>
          <div className="d-flex align-items-center ms-auto gap-3">
            <a href="/perfil" className="text-white fs-5 d-flex align-items-center" style={{ textDecoration: 'none' }} title="Perfil de usuario">
              <i className="bi bi-person-circle"></i>
              <span className="ms-1 d-none d-md-inline" id="header-nombre-usuario"></span>
            </a>
            <a href="/carrito" className="text-white fs-5" style={{ textDecoration: 'none' }}>
              <i className="bi bi-cart"></i>
            </a>
            <span className="text-white ms-2">Carrito (<span id="badge-carrito">0</span>)</span>
          </div>
        </div>
      </header>

      {/* Botones de Login/Registro */}
      <div className="container mt-2">
        <div className="d-flex justify-content-end gap-3">
          <a href="/login" className="nav-link link-accent">Iniciar sesión</a>
          <a href="/registro" className="nav-link link-accent">Registrar usuario</a>
        </div>
      </div>

      {/* Hero Section */}
      <section className="container hero-wireframe my-4 py-4 rounded-4 bg-secondary text-white">
        <div className="row align-items-center flex-md-row flex-column-reverse">
          <div className="col-md-7 text-md-start text-center">
            <h1 className="fw-bold font-orbitron text-white mb-2">Bienvenido a Level-Up Gamer</h1>
            <p className="mb-4 text-light">Tienda gamer en Chile: consolas, accesorios, PCs, torneos y comunidad. Tecnología y futuro en tus manos.</p>
            <a href="/catalogo" className="nav-link link-accent">
              <button className="btn btn-success px-4 py-2 fw-bold">
                <i className="bi bi-controller me-2"></i>Ver Productos
              </button>
            </a>
          </div>
          <div className="col-md-5 d-flex justify-content-md-end justify-content-center align-items-center mb-3 mb-md-0">
            <div className="hero-img-wireframe bg-dark border border-2 border-primary rounded-4 p-2 d-flex justify-content-center align-items-center">
              <img src="assets/img/dia_mundial_del_lol.png" alt="Hero Image" className="img-fluid rounded-4 hero-img-custom" />
            </div>
          </div>
        </div>
      </section>

      {/* Main: Catalogo (Originalmente oculto o dinámico) */}
      <main className="container my-4 seccion" id="catalogo">
        <div className="row g-4" id="grid-productos">
          {/* Aquí deberías mapear tus productos con React en lugar de insertarlos dinámicamente con JS */}
        </div>
      </main>

      {/* Main: Home Info */}
      <main className="container my-4 seccion" id="home">
        <div className="text-center py-5">
          <h2 className="fw-bold font-orbitron text-white mb-3">Tienda Online</h2>
          <p className="mb-4 text-light">Tu tienda online de confianza para todo lo relacionado con el mundo gamer. Explora nuestra amplia gama de productos y únete a nuestra comunidad.</p>
          <a href="/catalogo" className="nav-link link-accent">
            <button className="btn btn-success px-4 py-2 fw-bold">
              <i className="bi bi-controller me-2"></i>Ver Productos
            </button>
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-dark border-top border-secondary py-3 mt-5 text-white">
        <div className="container d-flex flex-wrap justify-content-between align-items-center">
          <div>
            <span className="fw-bold font-orbitron fs-5 text-neon">Level-Up Gamer</span>
            <div className="mt-3">
              <img src="assets/img/visa.png" width="32" alt="Visa" className="me-2" />
              <img src="assets/img/mastercard.png" width="32" alt="Mastercard" className="me-2" />
              <img src="assets/img/paypal.png" width="32" alt="Paypal" />
            </div>
          </div>
          <div className="d-flex flex-column align-items-end">
            <a 
              href="https://wa.me/56984977053" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="btn btn-success btn-whatsapp-footer d-flex align-items-center mb-2"
              style={{ backgroundColor: '#39FF14', borderColor: '#39FF14', color: '#000', fontWeight: 'bold' }}
            >
              <i className="bi bi-whatsapp me-2 fs-5"></i> Soporte Técnico (WhatsApp)
            </a>
            <span className="text-secondary small">¿Dudas o problemas? ¡Contáctanos!</span>
          </div>
        </div>
        <div className="text-center mt-3 text-secondary"><small>© 2025 Level-Up Gamer — Despachos a todo Chile</small></div>
      </footer>
    </div>
  );
};

export default Home;