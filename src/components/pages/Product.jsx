import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getProductByCodOrId, loadReviewsForProduct, saveReview } from '../../service/productService';
import useCart from '../../hooks/useCart';
import { useToast } from '../../context/ToastContext';

const Product = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState([]);
  const [name, setName] = useState('');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const { addItem } = useCart();
  const toast = useToast();

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      const prod = await getProductByCodOrId(id);
      if (mounted) setProduct(prod);
      const revs = await loadReviewsForProduct(prod || { id });
      if (mounted) setReviews(revs || []);
      setLoading(false);
    }
    load();
    return () => { mounted = false; };
  }, [id]);

  async function handleSubmitReview(e) {
    e.preventDefault();
    try {
      const targetId = product?.cod || product?.id || id;
      const res = await saveReview(targetId, name || 'Anon', rating, comment);
      if (res.ok) {
        toast('Reseña publicada');
        setName(''); setRating(5); setComment('');
        const revs = await loadReviewsForProduct(product || { id });
        setReviews(revs || []);
      } else {
        toast('No se pudo guardar la reseña', 'error');
      }
    } catch (e) {
      console.warn(e);
      toast('Error publicando reseña', 'error');
    }
  }

  if (loading) return <div className="text-white text-center">Cargando producto...</div>;
  if (!product) return <div className="text-white text-center">Producto no encontrado.</div>;

  const img = product.imagen || product.img || '/assets/img/logo.png';

  return (
    <main className="container">
      <div className="row">
        <div className="col-md-6">
          <img src={img} alt={product.nombre} className="img-fluid" />
        </div>
        <div className="col-md-6 text-white">
          <h1 className="font-orbitron">{product.nombre}</h1>
          <p className="fw-bold text-success">${parseInt(product.precio || 0).toLocaleString('es-CL')}</p>
          <p>{product.descripcion || product.desc || ''}</p>
          <div className="d-grid gap-2">
            <button className="btn btn-primary" onClick={() => addItem({ id: product.id || product.cod, nombre: product.nombre, precio: Number(product.precio)||0, imagen: img })}>Agregar al carrito</button>
          </div>
        </div>
      </div>

      <section className="mt-4">
        <h4 className="text-white">Reseñas</h4>
        <div className="mb-3">
          {reviews.length === 0 ? <div className="text-secondary">Aún no hay reseñas.</div> : (
            reviews.map(r => (
              <div key={r.id || Math.random()} className="mb-2 text-white">
                <div className="d-flex justify-content-between"><strong>{r.name || r.nombre || 'Anon'}</strong><small className="text-secondary">{r.rating || 0} ★</small></div>
                <div className="small text-secondary">{String(r.createdAt || '').toString()}</div>
                <div className="mt-1">{r.comment || r.comentario || ''}</div>
              </div>
            ))
          )}
        </div>

        <form onSubmit={handleSubmitReview} className="bg-secondary p-3 rounded">
          <div className="mb-2">
            <label className="form-label">Nombre</label>
            <input className="form-control" value={name} onChange={e => setName(e.target.value)} />
          </div>
          <div className="mb-2">
            <label className="form-label">Calificación</label>
            <select className="form-select" value={rating} onChange={e => setRating(Number(e.target.value))}>
              {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} ★</option>)}
            </select>
          </div>
          <div className="mb-2">
            <label className="form-label">Comentario</label>
            <textarea className="form-control" value={comment} onChange={e => setComment(e.target.value)} />
          </div>
          <div className="d-grid">
            <button className="btn btn-success">Enviar reseña</button>
          </div>
        </form>
      </section>
    </main>
  );
};

export default Product;
