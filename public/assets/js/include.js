async function includeHTML(selector, url) {
  const el = document.querySelector(selector);
  if (!el) return console.warn('Elemento para insertar no encontrado:', selector);
  try {
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
    const html = await res.text();
    el.innerHTML = html;
    const scripts = el.querySelectorAll('script');
    scripts.forEach(oldScript => {
      const newScript = document.createElement('script');
      Array.from(oldScript.attributes).forEach(a => newScript.setAttribute(a.name, a.value));
      newScript.textContent = oldScript.textContent;
      oldScript.parentNode.replaceChild(newScript, oldScript);
    });
  } catch (err) {
    console.error('Error cargando HTML desde', url, err);
  }
}

// Asegura que el script del carrito esté cargado; devuelve una Promise
function ensureCarritoLoaded() {
  // Antes de cargar carrito.js, asegurarnos de que el SDK de Firebase (compat v8) esté presente
  function ensureFirebaseSDKLoaded() {
    if (window && window.firebase && typeof window.firebase.initializeApp === 'function') return Promise.resolve();
    return new Promise((resolve) => {
      try {
        const scripts = Array.from(document.querySelectorAll('script[src]'));
        const hasApp = scripts.find(s => s.getAttribute('src') && s.getAttribute('src').toLowerCase().endsWith('firebase-app.js'));
        const hasFirestore = scripts.find(s => s.getAttribute('src') && s.getAttribute('src').toLowerCase().endsWith('firebase-firestore.js'));
        const loadIfMissing = [];
        if (!hasApp) loadIfMissing.push('https://www.gstatic.com/firebasejs/8.10.0/firebase-app.js');
        if (!hasFirestore) loadIfMissing.push('https://www.gstatic.com/firebasejs/8.10.0/firebase-firestore.js');

        if (loadIfMissing.length === 0) return resolve();

        let loaded = 0;
        loadIfMissing.forEach(src => {
          const s = document.createElement('script');
          s.src = src;
          s.async = true;
          s.onload = () => {
            loaded++;
            if (loaded >= loadIfMissing.length) resolve();
          };
          s.onerror = () => { loaded++; if (loaded >= loadIfMissing.length) resolve(); };
          document.head.appendChild(s);
        });
      } catch (e) {
        console.warn('Error cargando Firebase SDK:', e);
        resolve();
      }
    });
  }
  if (window && typeof window.agregarAlCarrito === 'function') return Promise.resolve();
  return new Promise((resolve) => {
    try {
      // Intentar cargar SDK de Firebase (compat) si es necesario antes de carrito.js
      ensureFirebaseSDKLoaded().catch(() => {});
      // Buscar cualquier <script> que apunte a un archivo llamado carrito.js (cualquier ruta)
      const scripts = Array.from(document.querySelectorAll('script[src]'));
      const existing = scripts.find(s => s.getAttribute('src') && s.getAttribute('src').trim().toLowerCase().endsWith('carrito.js'));
      if (existing) {
        // Si ya está cargado completamente, resolvemos inmediatamente
        if (existing.readyState === 'complete' || existing.readyState === 'loaded') return resolve();
        // Si aún se está cargando, atamos listeners
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => resolve());
        return;
      }
      // No existe aún → inyectar con la ruta absoluta esperada
      const s = document.createElement('script');
      s.src = '/assets/js/carrito.js';
      s.async = true;
      s.onload = () => resolve();
      s.onerror = () => { console.warn('No se pudo cargar /assets/js/carrito.js'); resolve(); };
      document.head.appendChild(s);
    } catch (e) {
      console.warn('Error inyectando carrito.js', e);
      resolve();
    }
  });
}

function includeHeaderFooter(headerUrl = '/assets/include/header.html', footerUrl = '/assets/include/footer.html') {
  const runAfterHeader = () => {
    ensureCarritoLoaded().then(() => {
      if (window && typeof window.actualizarCarritoUI === 'function') {
        try { window.actualizarCarritoUI(); } catch (e) { /* noop */ }
      }
    });
  };

  // Intenta cargar carrito.js lo antes posible incluso antes de insertar el header
  // para minimizar condiciones de carrera con otros listeners.
  try { ensureCarritoLoaded(); } catch (e) { /* noop */ }
  // Iniciar la carga inmediatamente (no esperar a DOMContentLoaded) para reducir
  // la posibilidad de que otros listeners de DOMContentLoaded se ejecuten antes
  // de que el script del carrito esté disponible.
  try {
    includeHTML('#header-placeholder', headerUrl).then(runAfterHeader);
  } catch (e) {
    // Si algo falla, también intentamos cargar en DOMContentLoaded como fallback
    document.addEventListener('DOMContentLoaded', () => includeHTML('#header-placeholder', headerUrl).then(runAfterHeader));
  }
  try {
    includeHTML('#footer-placeholder', footerUrl);
  } catch (e) {
    document.addEventListener('DOMContentLoaded', () => includeHTML('#footer-placeholder', footerUrl));
  }
}