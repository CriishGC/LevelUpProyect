import React, { useState } from 'react';
import useCart from '../../hooks/useCart';
import { useToast } from '../../context/ToastContext';

const Carrito = () => {
  const { items, totalConDescuento, total, descuento, cupon, changeQty, removeItem, applyCoupon, checkout } = useCart();
  const [codigoCupon, setCodigoCupon] = useState('');
  const toast = useToast();

  function discountMessage(codigo, descuentoValue) {
    if (!codigo) return '';
    if (descuentoValue > 0) return `Cupón ${codigo} aplicado — ahorro: $${Number(descuentoValue).toLocaleString('es-CL')}`;
    return `Cupón ${codigo} no aplica descuento.`;
  }

  return (
    <div className="carrito-container">
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
            <span className="text-white ms-2">Carrito (<span id="badge-carrito">{items.reduce((acc, it) => acc + (Number(it.qty) || 0), 0)}</span>)</span>
          </div>
        </div>
      </header>

      <main className="container carrito-main my-5">
        <div className="row">
          {/* Columna Izquierda: Lista de Productos */}
          <div className="col-lg-8 col-md-7">
            <h2 className="carrito-title mb-4 text-white font-orbitron">Mi carrito de compras</h2>
            
              <div id="carrito-lista">
              {items.length === 0 ? (
                <div className="alert alert-info">Tu carrito está vacío. <a href="/catalogo" className="alert-link">Ir a comprar</a>.</div>
              ) : (
                items.map((d) => (
                  <div key={d.id} className="card mb-3 bg-dark text-white border-secondary shadow-sm">
                    <div className="row g-0 align-items-center">
                      <div className="col-md-3 p-2 text-center">
                        <img 
                          src={d.imagen || "/assets/img/logo.png"} 
                          className="img-fluid rounded-3" 
                          alt={d.nombre}
                          style={{ maxHeight: '100px', objectFit: 'contain' }}
                        />
                      </div>
                      <div className="col-md-7">
                        <div className="card-body">
                          <h5 className="card-title font-orbitron">{d.nombre}</h5>
                          <p className="card-text text-success fw-bold mb-1">
                            Precio: ${Number(d.precio).toLocaleString('es-CL')}
                          </p>
                          <div className="d-flex align-items-center mt-2">
                            <button 
                              className="btn btn-sm btn-outline-light me-2" 
                              onClick={() => changeQty(d.id, Math.max(0, d.qty - 1))}
                            >-</button>
                            <span className="fw-bold mx-2">{d.qty}</span>
                            <button 
                              className="btn btn-sm btn-outline-light ms-2" 
                              onClick={() => changeQty(d.id, d.qty + 1)}
                            >+</button>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-2 text-end p-3">
                        <button 
                          className="btn btn-danger btn-sm" 
                          onClick={() => removeItem(d.id)}
                          title="Eliminar producto"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Columna Derecha: Resumen y Pago */}
          <div className="col-lg-4 col-md-5">
            <div className="card bg-secondary text-white p-3 rounded-4 shadow">
              <h4 className="font-orbitron mb-3 text-center">Resumen de Compra</h4>
              
              <div className="d-flex justify-content-between mb-2">
                <span>Subtotal:</span>
                <span>${Number(total).toLocaleString('es-CL')}</span>
              </div>
              {descuento > 0 && (
                <div className="d-flex justify-content-between mb-2 text-success">
                  <span>Descuento:</span>
                  <span>- ${Number(descuento).toLocaleString('es-CL')}</span>
                </div>
              )}

              <hr className="border-light" />
              
              <div className="d-flex justify-content-between mb-3 fs-4 fw-bold font-orbitron">
                <span>TOTAL:</span>
                <span id="total">${Number(totalConDescuento).toLocaleString('es-CL')}</span>
              </div>

              {/* Sección de Cupón */}
              <div className="mb-3">
                <label htmlFor="input-cupon" className="form-label small">¿Tienes un cupón?</label>
                <div className="input-group">
                  <input 
                    type="text" 
                    className="form-control" 
                    placeholder="Código" 
                    id="input-cupon"
                    value={codigoCupon}
                    onChange={(e) => setCodigoCupon(e.target.value)}
                  />
                  <button 
                    className="btn btn-dark border-light" 
                    onClick={() => {
                      const ok = applyCoupon(codigoCupon);
                      if (!ok) toast.showToast('Cupón no válido', { type: 'error' });
                      else toast.showToast('Cupón aplicado', { type: 'success' });
                    }}
                  >APLICAR</button>
                </div>
                {cupon && (
                  <small className={`d-block mt-2 ${descuento > 0 ? 'text-success' : 'text-warning'}`}>
                    {discountMessage(cupon, descuento)}
                  </small>
                )}
              </div>

              <button 
                className="btn btn-success w-100 py-2 fw-bold text-uppercase" 
                onClick={checkout}
                disabled={items.length === 0}
              >
                Ir a Pagar
              </button>
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

export default Carrito;