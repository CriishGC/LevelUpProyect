import React from 'react';

const Nosotros = () => {
  return (
    <div className="nosotros-container">
      <header className="navbar-electric py-3">
        <div className="container d-flex justify-content-between align-items-center">
          <a href="/" className="d-flex align-items-center text-decoration-none me-3">
            <img src="/assets/img/logo.png" alt="Logo" width="80px" height="80px" className="me-2" />
            <span className="fs-4 fw-bold font-orbitron text-white">Level-Up Gamer</span>
          </a>
          <nav className="flex-grow-1">
            <ul className="nav gap-3 justify-content-center">
              <li className="nav-item"><a className="nav-link text-white" href="/">Inicio</a></li>
              <li className="nav-item"><a className="nav-link text-white" href="/catalogo">Productos</a></li>
              <li className="nav-item"><a className="nav-link text-white" href="/nosotros">Nosotros</a></li>
              <li className="nav-item"><a className="nav-link text-white" href="/blog">Blog</a></li>
              <li className="nav-item"><a className="nav-link text-white" href="/contacto">Contacto</a></li>
            </ul>
          </nav>
          <div className="d-flex align-items-center ms-auto gap-3">
            <a href="/perfil" className="text-white fs-5" title="Perfil de usuario">
              <i className="bi bi-person-circle"></i>
            </a>
            <a href="/carrito" className="text-white fs-5">
              <i className="bi bi-cart"></i>
            </a>
            <span className="text-white ms-2">Carrito (<span id="badge-carrito">0</span>)</span>
          </div>
        </div>
      </header>

      <main className="container pb-5">
        <h1 className="text-center font-orbitron my-4 py-4 text-white">Acerca de nosotros</h1>
        
        <section id="historia" className="container hero-wireframe my-4 py-4 bg-secondary text-white rounded-4 p-4">
          <h2>Historia de la Tienda</h2>
          <p>
            Level-Up Gamer es una tienda online dedicada a satisfacer las necesidades de los entusiastas de los
            videojuegos en Chile. Lanzada hace dos años como respuesta a la creciente demanda durante la
            pandemia, Leves-Up Gamer ofrece una amplia gama de productos para gamers, desde consolas y
            accesorios hasta computadores y sillas especializadas. Aunque no cuenta con una ubicación física,
            realiza despachos a todo el país.      
          </p>
          <h2>Nuestra Misión</h2>
          <p>
            Proporcionar productos de alta calidad para gamers en todo Chile, ofreciendo una experiencia de
            compra única y personalizada, con un enfoque en la satisfacción del cliente y el crecimiento de la
            comunidad gamer.
          </p>
          <h2>Nuestra Visión</h2>
          <p>
            Ser la tienda online líder en productos para gamers en Chile, reconocida por su innovación, servicio
            al cliente excepcional, y un programa de fidelización basado en gamificación que recompense a
            nuestros clientes más fieles.
          </p>
        </section>

        <section id="recorrido" className="container hero-wireframe my-4 py-4 bg-secondary text-white rounded-4 p-4">
          <h2>Recorrido de la Empresa</h2>
          <ul>
            <li><strong>2019:</strong> Fundación de LevelUpProyect y primer proyecto entregado.</li>
            <li><strong>2020:</strong> Expansión del equipo y adquisición de nuevos clientes.</li>
            <li><strong>2021:</strong> Lanzamiento de nuestra plataforma principal.</li>
            <li><strong>2023:</strong> Reconocimiento en el sector por innovación y servicio.</li>
          </ul>
        </section>

        <section id="equipo" className="text-white">
          <h2 className="text-center mb-4">Equipo de Desarrollo</h2>
          <div className="row justify-content-center text-center g-4">
            <div className="col-md-4">
              <div className="bg-dark p-3 rounded-4 border border-secondary h-100">
                <img src="/assets/img/yuhui.png" alt="Cristóbal Gómez" className="img-fluid rounded-4 mb-3" style={{maxHeight: '200px'}} />
                <h3>Cristóbal Antonio Gómez Chau</h3>
                <p className="text-success">Desarrollador Full Stack</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="bg-dark p-3 rounded-4 border border-secondary h-100">
                <img src="/assets/img/papimicky.jpeg" alt="Sebastián Mariqueo" className="img-fluid rounded-4 mb-3" style={{maxHeight: '200px'}} />
                <h3>Sebastián Alberto Mariqueo Pérez</h3>
                <p className="text-success">Especialista Frontend</p>
              </div>
            </div>
            <div className="col-md-4">
              <div className="bg-dark p-3 rounded-4 border border-secondary h-100">
                <img src="/assets/img/flaitiano.jpeg" alt="Jonathan Lillo" className="img-fluid rounded-4 mb-3" style={{maxHeight: '200px'}} />
                <h3>Jonathan Jean Pierre Lillo Marín</h3>
                <p className="text-success">Gestor de Proyectos</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-dark border-top border-secondary py-3 mt-5 text-white text-center">
        <small>© 2025 Level-Up Gamer — Despachos a todo Chile</small>
      </footer>
    </div>
  );
};

export default Nosotros;