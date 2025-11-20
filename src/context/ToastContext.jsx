import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';

const ToastContext = createContext(null);

let idCounter = 1;

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message, { type = 'info', duration = 3000 } = {}) => {
    const id = `toast_${Date.now()}_${idCounter++}`;
    setToasts(prev => [...prev, { id, message, type }]);
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, duration);
    }
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ showToast, removeToast }}>
      {children}
      <div aria-live="polite" aria-atomic="true" style={{ position: 'fixed', top: 20, right: 20, zIndex: 20000 }}>
        {toasts.map(t => (
          <div key={t.id} className={`toast align-items-center text-white bg-${t.type === 'error' ? 'danger' : t.type === 'success' ? 'success' : 'secondary'} border-0 mb-2`} role="status" style={{ minWidth: 240, padding: '10px 14px', borderRadius: 8 }}>
            <div>{t.message}</div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(){
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export default ToastContext;
