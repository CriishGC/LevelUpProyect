import React, { useEffect, useState } from 'react';
import { getOfferProducts } from '../../service/productService';
import useCart from '../../hooks/useCart';

const Ofertas = () => {
  const [ofertas, setOfertas] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCart();

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      const data = await getOfferProducts();
      if (mounted) setOfertas(data || []);
      setLoading(false);
    }
    load();
    return () => { mounted = false; };
  }, []);

  return (
    <main className="container">
      <h1 className="text-center font-orbitron my-4">Ofertas</h1>
      {loading ? (
        <div className="text-center text-white">Cargando ofertas...</div>
      ) : !ofertas || ofertas.length === 0 ? (
        <div className="text-center text-white">No hay ofertas disponibles.</div>
      ) : (
        <div className="row g-4">
          {ofertas.map(p => {
            const precio = Number(p.precio || 0);
            const precioOferta = Number(p.precio_oferta || p.precioOferta || 0) || null;
            const mostrarOferta = precioOferta && precioOferta > 0 && precioOferta < precio;
            const img = p.imagen || p.img || '/assets/img/logo.png';
            return (
              <div key={p.id} className="col-md-4 col-lg-3">
                <div className="card bg-dark text-white h-100 border-secondary">
                  <img src={img} alt={p.nombre} className="card-img-top p-3" style={{maxHeight:200,objectFit:'contain'}} />
                  <div className="card-body d-flex flex-column">
                    <h5 className="card-title font-orbitron">{p.nombre}</h5>
                    <div className="mt-auto">
                      {mostrarOferta ? (
                        <div>
                          <div className="text-muted text-decoration-line-through">${parseInt(precio).toLocaleString('es-CL')}</div>
                          <div className="text-success fw-bold">${parseInt(precioOferta).toLocaleString('es-CL')}</div>
                        </div>
                      ) : (
                        <div className="text-success fw-bold">${parseInt(precio).toLocaleString('es-CL')}</div>
                      )}
                      <div className="d-grid gap-2 mt-2">
                        <button className="btn btn-light text-dark" onClick={() => addItem({ id: p.id || p.cod || p.codigo, nombre: p.nombre, precio: mostrarOferta ? precioOferta : precio, imagen: img })}>Agregar</button>
                        <a className="btn btn-outline-light" href={`/product/${encodeURIComponent(p.cod || p.id || '')}`}>Ver detalle</a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
};

export default Ofertas;
