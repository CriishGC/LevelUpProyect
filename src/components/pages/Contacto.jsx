import React, { useState } from 'react';
import { useToast } from '../../context/ToastContext';

const Contacto = () => {
  const toast = useToast();
  const [formData, setFormData] = useState({
    nombre: '',
    email: '',
    mensaje: ''
  });

  const handleChange = (e) => {
    const { id, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [id]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Datos del formulario:", formData);
    toast.showToast('¡Mensaje enviado con éxito! Nos pondremos en contacto contigo pronto.', { type: 'success' });
    // Aquí iría tu lógica para enviar los datos a Firebase o EmailJS
    setFormData({ nombre: '', email: '', mensaje: '' });
  };

  return (
    <div className="contacto-container">
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
            <a href="/perfil" className="text-white fs-5">
              <i className="bi bi-person-circle"></i>
            </a>
            <a href="/carrito" className="text-white fs-5">
              <i className="bi bi-cart"></i>
            </a>
            <span className="text-white ms-2">Carrito (<span id="badge-carrito">0</span>)</span>
          </div>
        </div>
      </header>

      <main className="container my-5">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className="card bg-secondary bg-opacity-75 border-0 rounded shadow">
              <div className="card-body">
                <div className="text-center mb-4">
                  <img src="/assets/img/logo.png" alt="Level-Up Gamer Logo" width="100" height="100" className="mb-2" />
                  <h2 className="font-orbitron fw-bold text-white mb-0">Level-Up Gamer</h2>
                </div>
                <h5 className="card-title text-center font-orbitron text-white mb-4">Formulario de Contacto</h5>
                
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label htmlFor="nombre" className="form-label text-white">Nombre Completo</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      id="nombre" 
                      placeholder="Ingresa tu nombre" 
                      required 
                      value={formData.nombre}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="email" className="form-label text-white">Correo</label>
                    <input 
                      type="email" 
                      className="form-control" 
                      id="email" 
                      placeholder="Ingresa tu correo" 
                      required 
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="mb-3">
                    <label htmlFor="mensaje" className="form-label text-white">Comentario</label>
                    <textarea 
                      className="form-control" 
                      id="mensaje" 
                      rows="4" 
                      placeholder="Escribe tu mensaje" 
                      required
                      value={formData.mensaje}
                      onChange={handleChange}
                    ></textarea>
                  </div>
                  <div className="d-grid">
                    <button type="submit" className="btn btn-outline-light fw-bold">Enviar Mensaje</button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-dark border-top border-secondary py-3 mt-5 text-white text-center">
        <small>© 2025 Level-Up Gamer — Despachos a todo Chile</small>
      </footer>
    </div>
  );
};

export default Contacto;