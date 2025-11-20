import React, { useState } from 'react';
import useCheckout from '../../hooks/useCheckout';
import useCart from '../../hooks/useCart';
import { useToast } from '../../context/ToastContext';

const Checkout = () => {
  const { detalles, total, loading, message, submitOrder } = useCheckout();
  const { clearCart } = useCart();
  const toast = useToast();

  const [form, setForm] = useState({
    name: '', email: '', phone: '', line1: '', city: '', region: '', zip: '', notes: ''
  });

  function onChange(e){
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e){
    e.preventDefault();
    // basic validation
    if (!form.name || !form.email) { toast.showToast('Nombre y email son obligatorios', { type: 'error' }); return; }
    const buyer = { name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), address: { line1: form.line1.trim(), city: form.city.trim(), region: form.region.trim(), zip: form.zip.trim() }, notes: form.notes.trim() };
    const res = await submitOrder(buyer);
    if (res && res.ok){
      clearCart();
      toast.showToast(res.simulated ? `Compra simulada. Código: ${res.code}` : `Compra realizada. Código: ${res.code}`, { type: 'success' });
    }
  }

  return (
    <main className="container my-5">
      <h2 className="mb-4">Checkout</h2>
      <div className="row">
        <div className="col-md-7">
          <form id="checkout-form" onSubmit={handleSubmit} noValidate>
            <div className="mb-3">
              <label className="form-label">Nombre completo</label>
              <input name="name" className="form-control" value={form.name} onChange={onChange} required />
            </div>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input name="email" type="email" className="form-control" value={form.email} onChange={onChange} required />
            </div>
            <div className="mb-3">
              <label className="form-label">Teléfono</label>
              <input name="phone" className="form-control" value={form.phone} onChange={onChange} />
            </div>
            <div className="mb-3">
              <label className="form-label">Dirección</label>
              <input name="line1" className="form-control" placeholder="Dirección" value={form.line1} onChange={onChange} />
            </div>
            <div className="row">
              <div className="col-md-4 mb-3"><input name="city" className="form-control" placeholder="Ciudad" value={form.city} onChange={onChange} /></div>
              <div className="col-md-4 mb-3"><input name="region" className="form-control" placeholder="Región" value={form.region} onChange={onChange} /></div>
              <div className="col-md-4 mb-3"><input name="zip" className="form-control" placeholder="Código postal" value={form.zip} onChange={onChange} /></div>
            </div>
            <div className="mb-3">
              <label className="form-label">Notas</label>
              <textarea name="notes" className="form-control" value={form.notes} onChange={onChange} />
            </div>
            <div className="d-grid">
              <button className="btn btn-primary" type="submit" disabled={loading}>Realizar pedido</button>
            </div>
          </form>
          <div id="checkout-message" className="mt-3">
            {message && (
              <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'}`}>{message.text}</div>
            )}
          </div>
        </div>
        <div className="col-md-5">
          <div className="card p-3 bg-secondary text-white">
            <h5 className="mb-3">Resumen de compra</h5>
            <div id="checkout-items">
              {detalles.length === 0 ? (
                <div className="small">Carrito vacío.</div>
              ) : (
                detalles.map(d => (
                  <div key={d.id} className="d-flex align-items-center mb-2">
                    <div className="flex-grow-1">
                      <div className="small fw-bold">{d.nombre}</div>
                      <div className="small text-muted">${Number(d.precio).toLocaleString('es-CL')} × {d.qty}</div>
                    </div>
                    <div className="text-end fw-bold">${Number(d.subtotal).toLocaleString('es-CL')}</div>
                  </div>
                ))
              )}
            </div>
            <hr className="border-light" />
            <div className="d-flex justify-content-between fw-bold">Total:<span id="checkout-total">${Number(total).toLocaleString('es-CL')}</span></div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default Checkout;
