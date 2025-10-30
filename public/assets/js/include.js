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

function includeHeaderFooter(headerUrl = '/assets/include/header.html', footerUrl = '/assets/include/footer.html') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      includeHTML('#header-placeholder', headerUrl);
      includeHTML('#footer-placeholder', footerUrl);
    });
  } else {
    includeHTML('#header-placeholder', headerUrl);
    includeHTML('#footer-placeholder', footerUrl);
  }
}