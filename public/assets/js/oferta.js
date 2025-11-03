(function () {
  if (typeof window._oferta_helpers_initialized === 'undefined') {
    window._oferta_helpers_initialized = true;
    if (typeof window.isURL === 'undefined') {
      window.isURL = (s) => typeof s === 'string' && /^https?:\/\//i.test(s);
    }
    if (typeof window.formateaCLP === 'undefined') {
      window.formateaCLP = (n) => (n || 0).toLocaleString('es-CL');
    }
    if (typeof window.escapeHtml === 'undefined') {
      window.escapeHtml = (s='') => String(s)
        .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
        .replaceAll('"','&quot;').replaceAll("'",'&#39;');
    }
    if (typeof window.debounce === 'undefined') {
      window.debounce = (fn, wait = 300) => {
        let t;
        return (...args) => {
          clearTimeout(t);
          t = setTimeout(() => fn.apply(this, args), wait);
        };
      };
    }
  }

  const PLACEHOLDER_IMG = 'https://via.placeholder.com/400x300/1f1f1f/999999?text=Sin+Imagen';
  const isURL_local = window.isURL;
  const formateaCLP_local = window.formateaCLP;
  const escapeHtml_local = window.escapeHtml;
  const debounce_local = window.debounce;

  let ofertasCargadas = [];
  let productosFiltradosActuales = [];

  const selById = (id) => document.getElementById(id);
  const inputBusqueda = () => selById('busqueda-ofertas') || selById('buscador') || selById('busqueda');
  const selCategoria  = () => selById('filtro-categoria');
  const inputMin      = () => selById('filtro-min');
  const inputMax      = () => selById('filtro-max');
  const ofertasListEl = () => selById('ofertas-list');
  const sinOfertasEl  = () => selById('sin-ofertas');
  const cardsCategoriasEl = () => selById('cardsCategorias');

  document.addEventListener('DOMContentLoaded', () => {
    const btnVerTodas = selById('btn-mostrar-todas');
    const btnBuscar = selById('btnBuscarOfertas');
    const btnLimpiar = selById('btnLimpiarOfertas');
    const btnTodosCategorias = selById('btn-todos-categorias');

    btnVerTodas?.addEventListener('click', () => { location.href = 'catalogo.html'; });

    // Helpers: iconos por categoría (puedes ampliar)
    function obtenerIconoCategoria(categoria) {
      const iconos = {
        'Poleras personalizadas': '👕',
        'Computadores gamers': '💻',
        'Consolas': '🎮',
        'Juegos de mesa': '🎲',
        'Mouse': '🖱️',
        'Mousepad': '🖥️',
        'Sillas gamers': '🪑',
        'Accesorios': '📦'
      };
      return iconos[categoria] || '📦';
    }

    function esOferta(p) {
      if (!p) return false;
      if (p.oferta === true) return true;
      if (typeof p.descuento === 'number' && p.descuento > 0) return true;

      const po = (typeof p.precioOferta === 'number') ? p.precioOferta
               : (typeof p.precio_oferta === 'number') ? p.precio_oferta
               : (typeof p.precio_oferta === 'string' && !isNaN(Number(p.precio_oferta))) ? Number(p.precio_oferta)
               : undefined;
      if (typeof po === 'number' && po > 0 && po < Number(p.precio || 0)) return true;

      const texto = ((p.nombre||'') + ' ' + (p.descripcion||p.desc||'') + ' ' + (p.categoria||p.cat||'')).toLowerCase();
      if (texto.includes('oferta') || texto.includes('promo') || texto.includes('descuento')) return true;
      return false;
    }

    function obtenerPrecioVisual(p) {
      const precio = Number(p.precio || p.price || 0);
      let precioOfertaVal = undefined;
      if (typeof p.precio_oferta === 'number' && p.precio_oferta > 0) precioOfertaVal = Number(p.precio_oferta);
      else if (typeof p.precioOferta === 'number' && p.precioOferta > 0) precioOfertaVal = Number(p.precioOferta);
      else if (typeof p.precio_oferta === 'string' && !isNaN(Number(p.precio_oferta))) precioOfertaVal = Number(p.precio_oferta);

      if (typeof precioOfertaVal === 'number' && precioOfertaVal > 0 && precioOfertaVal < precio) {
        return { oferta: true, precioOriginal: precio, precioOferta: precioOfertaVal };
      }
      if (typeof p.descuento === 'number' && p.descuento > 0) {
        const precioOferta = Math.round(precio * (1 - p.descuento / 100));
        return { oferta: true, precioOriginal: precio, precioOferta };
      }
      if (typeof p.precio_rebajado === 'number' && p.precio_rebajado > 0 && p.precio_rebajado < precio) {
        return { oferta: true, precioOriginal: precio, precioOferta: Number(p.precio_rebajado) };
      }
      return { oferta: false, precioOriginal: precio, precioOferta: precio };
    }

    function renderOfertas(lista) {
      const ofertasList = ofertasListEl();
      productosFiltradosActuales = lista || [];
      if (!ofertasList) return;
      if (!lista || !lista.length) {
        ofertasList.innerHTML = '';
        sinOfertasEl()?.classList.remove('d-none');
        return;
      }
      sinOfertasEl()?.classList.add('d-none');

      ofertasList.innerHTML = lista.map(p => {
        const srcImg = p.imagen
          ? (isURL_local(p.imagen) ? p.imagen : `../img/${p.imagen}`)
          : (p.img ? (isURL_local(p.img) ? p.img : `../img/${p.img}`) : PLACEHOLDER_IMG);

        const precios = obtenerPrecioVisual(p);
        const descuentoBadge = (precios.oferta && precios.precioOriginal > precios.precioOferta)
          ? Math.round(100 - (precios.precioOferta * 100 / precios.precioOriginal))
          : null;

        const cat = p.cat || p.categoria || p.category || 'Productos';
        const cod = encodeURIComponent(p.cod || p.id || '');
        const detalleHref = `product.html?cod=${cod}`;

        return `
          <div class="product-card oferta-card p-0" data-id="${escapeHtml_local(p.id || p.cod)}">
            ${descuentoBadge ? `<div class="badge-desc">-${descuentoBadge}%</div>` : (p.oferta ? `<div class="badge-desc">OFERTA</div>` : '')}
            <img src="${srcImg}" class="card-img-top oferta-img" alt="${escapeHtml_local(p.nombre)}" onerror="this.src='${PLACEHOLDER_IMG}'">
            <div class="card-body d-flex flex-column oferta-body">
              <div>
                <h5 class="card-title oferta-title">${escapeHtml_local(p.nombre)}</h5>
                <div class="oferta-cat text-secondary">${escapeHtml_local(cat)}</div>
              </div>
              <div class="mt-auto d-flex justify-content-between align-items-end gap-2">
                <div class="oferta-price text-end">
                  ${ (precios.oferta && precios.precioOriginal > precios.precioOferta)
                      ? `<div class="precio-original">$${formateaCLP_local(precios.precioOriginal)}</div>
                         <div class="precio-oferta">$${formateaCLP_local(precios.precioOferta)}</div>`
                      : `<div class="precio-oferta">$${formateaCLP_local(precios.precioOriginal)}</div>`
                  }
                </div>
                <div class="d-grid gap-2" style="min-width:120px;">
                  <a class="btn btn-outline-light btn-ver" href="${detalleHref}">Ver detalle</a>
                  <button class="btn-add-cart btn-add-cart-js" data-id="${escapeHtml_local(p.id || p.cod)}">Agregar</button>
                </div>
              </div>
            </div>
          </div>
        `;
      }).join('');

      // add to cart listeners
      document.querySelectorAll('.btn-add-cart-js').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = btn.getAttribute('data-id');
          if (typeof window.agregarAlCarrito === 'function') {
            const prod = (typeof window.getProductosGlobal === 'function')
              ? window.getProductosGlobal().find(x => (x.id||x.cod) == id)
              : ofertasCargadas.find(x => (x.id||x.cod) == id);
            if (prod) {
              window.agregarAlCarrito(prod);
              if (typeof window.toast === 'function') window.toast(`"${prod.nombre}" agregado al carrito`);
              return;
            }
          }
          // fallback localStorage
          let carrito = JSON.parse(localStorage.getItem('carrito') || '[]');
          let productoExistente = carrito.find(it => it.id === id);
          const nombre = btn.closest('.oferta-card')?.querySelector('.oferta-title')?.textContent || 'Producto';
          if (productoExistente) productoExistente.cantidad = (productoExistente.cantidad||1) + 1;
          else carrito.push({ id, nombre, precio: 0, cantidad: 1 });
          localStorage.setItem('carrito', JSON.stringify(carrito));
          if (typeof window.toast === 'function') window.toast(`"${nombre}" agregado al carrito`);
          else alert('Producto agregado al carrito');
        });
      });
    }

    function poblarCategoriasUI(lista) {
      const cardsRoot = cardsCategoriasEl();
      const sel = selCategoria();
      if (!cardsRoot) return;
      const setCats = new Set();
      (lista || []).forEach(p => setCats.add(p.cat || p.categoria || 'Sin categoría'));
      const cats = Array.from(setCats).sort((a,b)=>a.localeCompare(b,'es'));
      cardsRoot.innerHTML = cats.map(categoria => `
        <div class="categoria-card" data-categoria="${escapeHtml_local(categoria)}">
          <div class="categoria-img">${obtenerIconoCategoria(categoria)}</div>
          <div class="categoria-nombre">${escapeHtml_local(categoria)}</div>
        </div>
      `).join('');

      // poblar select oculto también si existe
      if (sel) {
        sel.innerHTML = [
          `<option value="">Todas las categorías</option>`,
          ...cats.map(c => `<option value="${escapeHtml_local(c)}">${escapeHtml_local(c)}</option>`)
        ].join('');
      }

      // listeners en cuadros
      cardsRoot.querySelectorAll('.categoria-card').forEach(card => {
        card.addEventListener('click', () => {
          const cat = card.dataset.categoria;
          // togglear selección visual
          cardsRoot.querySelectorAll('.categoria-card').forEach(c => c.classList.remove('selected'));
          card.classList.add('selected');
          // sincronizar select y aplicar filtro
          if (sel) sel.value = cat;
          aplicarFiltroOfertasDesdeInputs();
          // scroll to offers area (opcional)
          const ofertasList = ofertasListEl();
          if (ofertasList) ofertasList.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      });
    }

    // Filtrado local sobre ofertasCargadas
    function aplicarFiltroOfertasDesdeInputs() {
      const termino = (inputBusqueda()?.value || '').toLowerCase().trim();
      const catVal = (selCategoria()?.value || '').trim();
      const minVal = Number(inputMin()?.value || '');
      const maxVal = Number(inputMax()?.value || '');

      let lista = [...(ofertasCargadas || [])];

      if (termino) {
        lista = lista.filter(p =>
          (p.nombre || '').toLowerCase().includes(termino) ||
          ((p.descripcion || p.desc || '') || '').toLowerCase().includes(termino) ||
          ((p.categoria || p.cat || '') || '').toLowerCase().includes(termino) ||
          ((p.cod || p.codigo || p.id) || '').toString().toLowerCase().includes(termino)
        );
      }

      if (catVal) {
        lista = lista.filter(p => (p.cat || p.categoria || '') === catVal);
      }

      if (!Number.isNaN(minVal) && minVal > 0) {
        lista = lista.filter(p => (Number(p.precio) || 0) >= (minVal || 0));
      }
      if (!Number.isNaN(maxVal) && maxVal > 0) {
        lista = lista.filter(p => (Number(p.precio) || 0) <= maxVal);
      }

      renderOfertas(lista);
    }

    // Firestore / fallback loaders
    async function obtenerProductos_de_oferta_fire() {
      if (typeof window.getProductosGlobal === 'function') {
        try {
          const todos = window.getProductosGlobal() || [];
          const soloOfertas = (todos || []).filter(esOferta);
          if (soloOfertas.length) {
            console.log('oferta.js: usando getProductosGlobal() para ofertas');
            return soloOfertas;
          }
        } catch (e) { console.warn('oferta.js getProductosGlobal error', e); }
      }

      if (!(window.firebase && (typeof firebase !== 'undefined'))) {
        console.warn('oferta.js: Firebase SDK no cargado; usando getProductosGlobal o fallback.');
        return [];
      }

      try {
        if (!firebase.apps || !firebase.apps.length) {
          const firebaseConfig = {
            apiKey: "AIzaSyCbVcEwCAFPJcvDwTCJnqtnyVJc4asYTHo",
            authDomain: "tiendalevelup-ccd23.firebaseapp.com",
            projectId: "tiendalevelup-ccd23",
          };
          firebase.initializeApp(firebaseConfig);
        }
      } catch (e) {
        console.warn('oferta.js: firebase init catch', e);
      }

      try {
        const db = firebase.firestore();
        const colName = 'producto_oferta';
        const snap = await db.collection(colName).get();
        if (snap && !snap.empty) {
          const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          return docs.map(p => ({
            id: p.id,
            cod: p.cod || p.codigo || p.id || '',
            nombre: p.nombre || p.title || 'Producto',
            descripcion: p.descripcion || p.desc || p.description || '',
            precio: Number(p.precio || p.price || 0) || 0,
            cat: p.categoria || p.cat || p.category || 'Sin categoría',
            categoria: p.categoria || p.cat || p.category || 'Sin categoría',
            imagen: p.imagen || p.img || p.image || '',
            img: p.img || p.imagen || p.image || '',
            stock: (typeof p.stock !== 'undefined') ? Number(p.stock) : undefined,
            oferta: p.oferta === true || false,
            descuento: (typeof p.descuento === 'number') ? Number(p.descuento) : 0,
            precioOferta: (typeof p.precio_oferta === 'number') ? Number(p.precio_oferta)
                         : (typeof p.precioOferta === 'number') ? Number(p.precioOferta)
                         : undefined,
            raw: p
          }));
        } else {
          console.log(`oferta.js: colección ${colName} vacía o no encontrada.`);
          return [];
        }
      } catch (e) {
        console.warn('oferta.js: error leyendo producto_oferta:', e);
        return [];
      }
    }

    async function cargarYMostrarOfertas() {
      const ofertasFire = await obtenerProductos_de_oferta_fire();
      const ofertasValidas = (ofertasFire || []).filter(esOferta);
      if (ofertasValidas && ofertasValidas.length) {
        ofertasCargadas = ofertasValidas;
        poblarCategoriasUI(ofertasCargadas);
        renderOfertas(ofertasCargadas);
        return;
      }

      if (typeof window.getProductosGlobal === 'function') {
        const todos = window.getProductosGlobal() || [];
        const soloOfertas = (todos || []).filter(esOferta);
        if (soloOfertas.length) {
          ofertasCargadas = soloOfertas;
          poblarCategoriasUI(ofertasCargadas);
          renderOfertas(ofertasCargadas);
          return;
        }
      }

      if (typeof PRODUCTOS_MOCK !== 'undefined') {
        const soloOfertasMock = PRODUCTOS_MOCK.filter(esOferta);
        if (soloOfertasMock.length) {
          ofertasCargadas = soloOfertasMock;
          poblarCategoriasUI(ofertasCargadas);
          renderOfertas(ofertasCargadas);
          return;
        }
      }

      ofertasCargadas = [];
      renderOfertas([]);
    }

    // inicializar
    cargarYMostrarOfertas();
    let reintentos = 0;
    const reintentarInterval = setInterval(async () => {
      reintentos++;
      await cargarYMostrarOfertas();
      if (typeof window.getProductosGlobal === 'function' || reintentos > 10) clearInterval(reintentarInterval);
    }, 700);

    // hooks UI
    if (inputBusqueda()) {
      inputBusqueda().addEventListener('input', debounce_local(() => aplicarFiltroOfertasDesdeInputs(), 250));
      inputBusqueda().addEventListener('keypress', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); aplicarFiltroOfertasDesdeInputs(); }
      });
    }
    selCategoria()?.addEventListener && selCategoria().addEventListener('change', aplicarFiltroOfertasDesdeInputs);
    inputMin()?.addEventListener && inputMin().addEventListener('input', aplicarFiltroOfertasDesdeInputs);
    inputMax()?.addEventListener && inputMax().addEventListener('input', aplicarFiltroOfertasDesdeInputs);
    btnBuscar?.addEventListener && btnBuscar.addEventListener('click', aplicarFiltroOfertasDesdeInputs);
    btnLimpiar?.addEventListener && btnLimpiar.addEventListener('click', () => {
      if (inputBusqueda()) inputBusqueda().value = '';
      if (selCategoria()) selCategoria().value = '';
      if (inputMin()) inputMin().value = '';
      if (inputMax()) inputMax().value = '';
      // remove selection visual
      const cardsRoot = cardsCategoriasEl();
      cardsRoot?.querySelectorAll('.categoria-card')?.forEach(c => c.classList.remove('selected'));
      renderOfertas(ofertasCargadas);
    });

    btnTodosCategorias?.addEventListener('click', () => {
      if (selCategoria()) selCategoria().value = '';
      const cardsRoot = cardsCategoriasEl();
      cardsRoot?.querySelectorAll('.categoria-card')?.forEach(c => c.classList.remove('selected'));
      renderOfertas(ofertasCargadas);
    });

    // Exports
    window.getOfertasCargadas = () => ofertasCargadas;
    window.refrescarOfertas = cargarYMostrarOfertas;
    window.getProductosFiltradosActualesOfertas = () => productosFiltradosActuales;
    window.obtenerIconoCategoria = obtenerIconoCategoria;
  });
})();