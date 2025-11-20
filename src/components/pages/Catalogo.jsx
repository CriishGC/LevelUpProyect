import React, { useState, useEffect } from 'react';
import { collection, getDocs } from "firebase/firestore";
// Asegúrate de que esta ruta apunte a tu archivo de configuración real
import { db } from "../../config/firebase"; 

const Catalogo = () => {
  // Estados
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Estados para filtros
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('');
  const [precioMin, setPrecioMin] = useState('');
  const [precioMax, setPrecioMax] = useState('');

  const categorias = ["Consolas", "Juegos", "Accesorios", "PC Gamer"];

  // Función para cargar datos desde Firebase
  useEffect(() => {
    const cargarProductos = async () => {
      try {
        // NOTA: Tu configuración usa Firebase Modular (v9+), por eso usamos collection() y getDocs()
        // en lugar de db.collection().get()
        const productosRef = collection(db, "producto");
        const snapshot = await getDocs(productosRef);
        
        const data = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));

        setProductos(data);
        setLoading(false);

        // Mantenemos esto para compatibilidad con tus scripts antiguos (funciones.js)
        window.catalogo = data;
        window.PRODUCTOS = data;
        
        console.log("Productos cargados:", data.length);
      } catch (err) {
        console.error("Error al cargar productos:", err);
        setLoading(false);
      }
    };

    cargarProductos();
  }, []);

  // Filtrado en tiempo real (Frontend)
  const productosFiltrados = productos.filter(prod => {
    const cumpleNombre = prod.nombre?.toLowerCase().includes(busqueda.toLowerCase());
    const cumpleCategoria = categoria ? prod.categoria === categoria : true;
    const cumplePrecioMin = precioMin ? (prod.precio >= parseFloat(precioMin)) : true;
    const cumplePrecioMax = precioMax ? (prod.precio <= parseFloat(precioMax)) : true;
    
    return cumpleNombre && cumpleCategoria && cumplePrecioMin && cumplePrecioMax;
  });

  const limpiarFiltros = () => {
    setBusqueda('');
    setCategoria('');
    setPrecioMin('');
    setPrecioMax('');
  };

  return (
    <div className="catalogo-container">
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

      <main className="container pb-5">
        <h1 className="text-center font-orbitron my-4 py-4 text-white">PRODUCTOS</h1>
        
        {/* Filtros */}
        <div className="row mb-4">
          <div className="col-md-3">
            <input type="search" className="form-control" placeholder="Buscar producto..." 
              value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          </div>
          <div className="col-md-3">
            <select className="form-select" value={categoria} onChange={(e) => setCategoria(e.target.value)}>
              <option value="">Todas las categorías</option>
              {categorias.map((cat, i) => <option key={i} value={cat}>{cat}</option>)}
            </select>
          </div>
          <div className="col-md-2">
            <input type="number" className="form-control" placeholder="Min $" 
              value={precioMin} onChange={(e) => setPrecioMin(e.target.value)} />
          </div>
          <div className="col-md-2">
            <input type="number" className="form-control" placeholder="Max $" 
              value={precioMax} onChange={(e) => setPrecioMax(e.target.value)} />
          </div>
          <div className="col-md-2">
            <button className="btn btn-outline-light w-100" onClick={limpiarFiltros}>Limpiar</button>
          </div>
        </div>

        {/* Lista de Productos */}
        <div className="row g-4 justify-content-center">
          {loading ? (
            <div className="text-white text-center">Cargando productos...</div>
          ) : productosFiltrados.length === 0 ? (
            <div className="text-white text-center">No se encontraron productos.</div>
          ) : (
            productosFiltrados.map((prod) => (
              <div key={prod.id} className="col-md-4 col-lg-3">
                 <div className="card bg-dark text-white border-secondary h-100">
                    {/* Asegúrate de que en Firebase el campo sea 'imagen' o 'img' */}
                    <img 
                      src={prod.imagen || "/assets/img/logo.png"} 
                      className="card-img-top p-3" 
                      alt={prod.nombre} 
                      style={{ maxHeight: '200px', objectFit: 'contain' }}
                    />
                    <div className="card-body d-flex flex-column">
                        <h5 className="card-title font-orbitron">{prod.nombre}</h5>
                        <p className="card-text text-success fw-bold">${parseInt(prod.precio).toLocaleString('es-CL')}</p>
                        <button className="btn btn-primary mt-auto">Agregar al Carrito</button>
                    </div>
                 </div>
              </div>
            ))
          )}
        </div>
      </main>

      <footer className="bg-dark border-top border-secondary py-3 mt-5 text-white text-center">
        <small>© 2025 Level-Up Gamer</small>
      </footer>
    </div>
  );
};

export default Catalogo;