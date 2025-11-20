import React, { useState, useEffect } from 'react';

const Carrito = () => {
  // Estados para manejar el carrito y la UI
  const [carrito, setCarrito] = useState([]);
  const [total, setTotal] = useState(0);
  const [cupon, setCupon] = useState("");
  const [mensajeDescuento, setMensajeDescuento] = useState("");
  const [descuentoAplicado, setDescuentoAplicado] = useState(0);

  // Cargar carrito desde localStorage al montar el componente
  useEffect(() => {
    const carritoGuardado = JSON.parse(localStorage.getItem('carrito')) || [];
    setCarrito(carritoGuardado);
    calcularTotal(carritoGuardado, 0);
  }, []);

  // Función para calcular el total (considerando descuentos)
  const calcularTotal = (productos, descuento = 0) => {
    const sumaSubtotal = productos.reduce((acc, item) => acc + (item.precio * item.cantidad), 0);
    const totalConDescuento = sumaSubtotal * (1 - descuento);
    setTotal(Math.round(totalConDescuento));
  };

  // Actualizar cantidad de un producto
  const cambiarCantidad = (id, cambio) => {
    const nuevoCarrito = carrito.map(item => {
      if (item.id === id) {
        const nuevaCantidad = item.cantidad + cambio;
        return { ...item, cantidad: nuevaCantidad > 0 ? nuevaCantidad : 1 };
      }
      return item;
    });
    
    setCarrito(nuevoCarrito);
    localStorage.setItem('carrito', JSON.stringify(nuevoCarrito));
    calcularTotal(nuevoCarrito, descuentoAplicado);
    
    // Evento para actualizar el badge del header (si el header escucha este evento)
    window.dispatchEvent(new Event("storage"));
  };

  // Eliminar producto del carrito
  const eliminarProducto = (id) => {
    const nuevoCarrito = carrito.filter(item => item.id !== id);
    setCarrito(nuevoCarrito);
    localStorage.setItem('carrito', JSON.stringify(nuevoCarrito));
    calcularTotal(nuevoCarrito, descuentoAplicado);
    window.dispatchEvent(new Event("storage"));
  };

  // Lógica para aplicar cupón
  const aplicarCupon = () => {
    if (cupon.toUpperCase() === "DUOCUC") {
      const porcentajeDescuento = 0.10; // 10%
      setDescuentoAplicado(porcentajeDescuento);
      setMensajeDescuento("¡Cupón DUOCUC aplicado exitosamente! (10% dcto)");
      calcularTotal(carrito, porcentajeDescuento);
    } else {
      setDescuentoAplicado(0);
      setMensajeDescuento("El cupón ingresado no es válido.");
      calcularTotal(carrito, 0);
    }
  };

  // Simulación de proceso de pago
  const handleCheckout = () => {
    if (carrito.length === 0) {
      alert("Tu carrito está vacío.");
      return;
    }
    alert(`Procesando pago por $${total.toLocaleString('es-CL')}...`);
    // Aquí iría la integración con WebPay o redirección
  };

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
            <span className="text-white ms-2">Carrito (<span id="badge-carrito">{carrito.reduce((acc, item) => acc + item.cantidad, 0)}</span>)</span>
          </div>
        </div>
      </header>

      <main className="container carrito-main my-5">
        <div className="row">
          {/* Columna Izquierda: Lista de Productos */}
          <div className="col-lg-8 col-md-7">
            <h2 className="carrito-title mb-4 text-white font-orbitron">Mi carrito de compras</h2>
            
            <div id="carrito-lista">
              {carrito.length === 0 ? (
                <div className="alert alert-info">Tu carrito está vacío. <a href="/catalogo" className="alert-link">Ir a comprar</a>.</div>
              ) : (
                carrito.map((item) => (
                  <div key={item.id} className="card mb-3 bg-dark text-white border-secondary shadow-sm">
                    <div className="row g-0 align-items-center">
                      <div className="col-md-3 p-2 text-center">
                        <img 
                          src={item.imagen || "/assets/img/logo.png"} 
                          className="img-fluid rounded-3" 
                          alt={item.nombre} 
                          style={{ maxHeight: '100px', objectFit: 'contain' }}
                        />
                      </div>
                      <div className="col-md-7">
                        <div className="card-body">
                          <h5 className="card-title font-orbitron">{item.nombre}</h5>
                          <p className="card-text text-success fw-bold mb-1">
                            Precio: ${parseInt(item.precio).toLocaleString('es-CL')}
                          </p>
                          <div className="d-flex align-items-center mt-2">
                            <button 
                              className="btn btn-sm btn-outline-light me-2" 
                              onClick={() => cambiarCantidad(item.id, -1)}
                            >-</button>
                            <span className="fw-bold mx-2">{item.cantidad}</span>
                            <button 
                              className="btn btn-sm btn-outline-light ms-2" 
                              onClick={() => cambiarCantidad(item.id, 1)}
                            >+</button>
                          </div>
                        </div>
                      </div>
                      <div className="col-md-2 text-end p-3">
                        <button 
                          className="btn btn-danger btn-sm" 
                          onClick={() => eliminarProducto(item.id)}
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
                <span>${carrito.reduce((acc, item) => acc + (item.precio * item.cantidad), 0).toLocaleString('es-CL')}</span>
              </div>
              
              {descuentoAplicado > 0 && (
                <div className="d-flex justify-content-between mb-2 text-success">
                  <span>Descuento:</span>
                  <span>- {(descuentoAplicado * 100)}%</span>
                </div>
              )}

              <hr className="border-light" />
              
              <div className="d-flex justify-content-between mb-3 fs-4 fw-bold font-orbitron">
                <span>TOTAL:</span>
                <span id="total">${total.toLocaleString('es-CL')}</span>
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
                    value={cupon}
                    onChange={(e) => setCupon(e.target.value)}
                  />
                  <button 
                    className="btn btn-dark border-light" 
                    onClick={aplicarCupon}
                  >APLICAR</button>
                </div>
                {mensajeDescuento && (
                  <small className={`d-block mt-2 ${descuentoAplicado > 0 ? 'text-success' : 'text-warning'}`}>
                    {mensajeDescuento}
                  </small>
                )}
              </div>

              <button 
                className="btn btn-success w-100 py-2 fw-bold text-uppercase" 
                onClick={handleCheckout}
                disabled={carrito.length === 0}
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