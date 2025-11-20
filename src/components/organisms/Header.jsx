import React from 'react';
import { Link } from 'react-router-dom';
import useCart from '../../hooks/useCart';

const Header = () => {
  const { items } = useCart();
  const totalItems = (items || []).reduce((s,i) => s + (Number(i.qty)||0), 0);

  return (
    <header className="navbar-electric py-3">
      <div className="container d-flex justify-content-between align-items-center">
        <Link to="/" className="d-flex align-items-center text-decoration-none me-3">
          <img src="/assets/img/logo.png" alt="Logo" width="80" height="80" className="me-2"/>
          <span className="fs-4 fw-bold font-orbitron text-white">Level-Up Gamer</span>
        </Link>
        <nav className="flex-grow-1">
          <ul className="nav gap-3 justify-content-center">
            <li className="nav-item"><Link className="nav-link text-white" to="/">Inicio</Link></li>
            <li className="nav-item"><Link className="nav-link text-white" to="/catalogo">Productos</Link></li>
            <li className="nav-item"><Link className="nav-link text-white" to="/nosotros">Nosotros</Link></li>
            <li className="nav-item"><Link className="nav-link text-white" to="/blog">Blog</Link></li>
            <li className="nav-item"><Link className="nav-link text-white" to="/contacto">Contacto</Link></li>
          </ul>
        </nav>
        <div className="d-flex align-items-center ms-auto gap-3">
          <Link to="/perfil" className="text-white fs-5"><i className="bi bi-person-circle"></i></Link>
          <Link to="/carrito" className="text-white fs-5"><i className="bi bi-cart"></i></Link>
          <span className="text-white ms-2">Carrito (<span id="badge-carrito">{totalItems || 0}</span>)</span>
        </div>
      </div>
    </header>
  );
};

export default Header;
