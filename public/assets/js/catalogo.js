/**
 * js/catalogo.js
 * Catálogo: carga desde Firestore o desde mocks expuestos por React/otros (window.catalogo / window.PRODUCTOS).
 * Integración con tu HTML (IDs esperados):
 *   - busqueda (input principal)
 *   - searchInput (input en navbar)
 *   - filtro-categoria (select)
 *   - filtro-min (input number)
 *   - filtro-max (input number)
 *   - productos-lista (contenedor grid)
 *   - badge-carrito (span o elemento para mostrar cantidad|total)
 *
 * Carrito se guarda en localStorage con clave 'levelup_carrito_v1'.
 *
 * Uso:
 *   - Puedes definir window.firebaseConfigApp = { ... } antes de este script para que intente usar Firestore.
 *   - Si usas React loader, expón los datos con window.catalogo = productos y window.PRODUCTOS = productos
 *     y dispatchEvent(new Event('productos-loaded')) para notificar al script.
 *
 * Exporta globalmente:
 *   - window.Catalogo  (API principal)
 *   - window.mostrarTodos() and window.limpiarFiltros()
 */

(function (window, document) {
  'use strict';

  const STORAGE_KEY = 'levelup_carrito_v1';

  const Catalogo = {
    // modos: 'firebase' | 'mock' | 'auto'
    mode: 'auto',
    firebaseConfig: null,
    collectionName: 'producto',
    db: null,

    // datos
    productos: [],
    filtrados: [],

    // carrito: array de { id, nombre, precio, imagen, cantidad }
    carrito: JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'),

    // filtros de UI
    filtros: {
      search: '',
      category: '',
      minPrice: null,
      maxPrice: null
    },

    // referencias DOM (rellenadas en _bindDOM)
    el: {},

    // Inicializa (opcionalmente pasar { mode, firebaseConfig, collectionName })
    async init(opts = {}) {
      if (opts.mode) this.mode = opts.mode;
      if (opts.firebaseConfig) this.firebaseConfig = opts.firebaseConfig;
      if (opts.collectionName) this.collectionName = opts.collectionName;

      this._bindDOM();

      // intentar inicializar firebase si se solicitó o si hay config global
      const cfg = this.firebaseConfig || window.firebaseConfigApp || null;
      if (this.mode === 'firebase' || (this.mode === 'auto' && cfg)) {
        if (!window.firebase) {
          console.warn('Firebase SDK no detectado. Se usará modo mock si no se inicializa.');
          if (this.mode === 'firebase') throw new Error('Firebase SDK requerido para modo firebase.');
        } else {
          try {
            if (!firebase.apps || !firebase.apps.length) {
              firebase.initializeApp(cfg);
            }
          } catch (e) {
            // puede estar ya inicializado; continuar
          }
          if (!firebase.firestore) throw new Error('Firestore no disponible.');
          this.db = firebase.firestore();
          this.mode = 'firebase';
        }
      }

      if (this.mode === 'mock' || (this.mode === 'auto' && !this.db)) {
        this.mode = 'mock';
      }

      // cargar productos (prioriza variables globales si existen)
      await this.cargarProductos();

      // inicializar UI y listeners
      this._initUI();

      // render inicial
      this._render();

      // actualizar badge carrito
      this._actualizarBadge();

      return this;
    },

    // Bindear referencias DOM (IDs que tu HTML provee)
    _bindDOM() {
      this.el = {
        buscadorHeader: document.getElementById('searchInput'),
        buscador: document.getElementById('busqueda'),
        filtroCategoria: document.getElementById('filtro-categoria'),
        filtroMin: document.getElementById('filtro-min'),
        filtroMax: document.getElementById('filtro-max'),
        productosLista: document.getElementById('productos-lista'),
        badgeCarrito: document.getElementById('badge-carrito'),
      };
    },

    // Cargar productos: prioridad:
    // 1) window.catalogo or window.PRODUCTOS (expuestos por React o otro loader)
    // 2) Firestore (si modo firebase y db disponible)
    // 3) window.PRODUCTOS (fallback)
    async cargarProductos() {
      // 1) chequear variables globales expuestas
      const globalCatalog = window.catalogo || window.PRODUCTOS;
      if (globalCatalog && Array.isArray(globalCatalog) && globalCatalog.length) {
        this.productos = globalCatalog.map(p => ({
          id: p.id || p.cod || slugify(p.nombre || p.title || ''),
          categoria: p.categoria || p.cat || p.category || '',
          imagen: p.imagen || p.imagenUrl || p.img || p.imagen || '',
          nombre: p.nombre || p.title || '',
          precio: Number(p.precio || p.price || 0),
          stock: Number(p.stock || 0),
          descripcion: p.descripcion || p.desc || ''
        }));
        this.filtrados = [...this.productos];
        console.log(`Catalogo: cargados ${this.productos.length} productos desde variable global.`);
        return this.productos;
      }

      // 2) si modo firebase
      if (this.mode === 'firebase' && this.db) {
        try {
          const snap = await this.db.collection(this.collectionName).get();
          this.productos = snap.docs.map(doc => {
            const d = doc.data();
            return {
              id: doc.id,
              categoria: d.categoria || '',
              imagen: d.imagen || d.imagenUrl || '',
              nombre: d.nombre || '',
              precio: Number(d.precio || 0),
              stock: Number(d.stock || 0),
              descripcion: d.descripcion || d.desc || ''
            };
          });
          this.filtrados = [...this.productos];
          console.log(`Catalogo: cargados ${this.productos.length} productos desde Firestore.`);
          return this.productos;
        } catch (err) {
          console.error('Error leyendo Firestore:', err);
          this.productos = [];
        }
      }

      // 3) fallback a window.PRODUCTOS si existe (antiguo mock)
      if (window.PRODUCTOS && Array.isArray(window.PRODUCTOS)) {
        this.productos = window.PRODUCTOS.map(p => ({
          id: p.cod || slugify(p.nombre),
          categoria: p.cat || p.categoria || '',
          imagen: p.img || p.imagen || '',
          nombre: p.nombre || '',
          precio: Number(p.precio || 0),
          stock: Number(p.stock || 0),
          descripcion: p.desc || p.descripcion || ''
        }));
      } else {
        this.productos = [];
      }
      this.filtrados = [...this.productos];
      console.log(`Catalogo: cargados ${this.productos.length} productos (fallback).`);
      return this.productos;
    },

    // Inicializar UI: listeners y llenado de categorias
    _initUI() {
      // llenar select categorias
      this._llenarCategorias();

      // Buscadores: press Enter para buscar
      if (this.el.buscador) {
        this.el.buscador.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') this._onBuscarMain();
        });
      }
      if (this.el.buscadorHeader) {
        this.el.buscadorHeader.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            if (this.el.buscador) this.el.buscador.value = this.el.buscadorHeader.value;
            this._onBuscarMain();
          }
        });
      }

      // filtros: categoria / precio
      if (this.el.filtroCategoria) {
        this.el.filtroCategoria.addEventListener('change', () => {
          this.filtros.category = this.el.filtroCategoria.value || '';
          this.applyFilters();
        });
      }
      if (this.el.filtroMin) {
        this.el.filtroMin.addEventListener('input', () => {
          const v = this.el.filtroMin.value;
          this.filtros.minPrice = (v === '' || isNaN(Number(v))) ? null : Number(v);
          this.applyFilters();
        });
      }
      if (this.el.filtroMax) {
        this.el.filtroMax.addEventListener('input', () => {
          const v = this.el.filtroMax.value;
          this.filtros.maxPrice = (v === '' || isNaN(Number(v))) ? null : Number(v);
          this.applyFilters();
        });
      }

      // Delegación clicks para "Agregar al carrito"
      if (this.el.productosLista) {
        this.el.productosLista.addEventListener('click', (e) => {
          const btn = e.target.closest('.btn-add-cart');
          if (btn) {
            const id = btn.dataset.id;
            this.agregarAlCarrito(id);
          }
        });
      }
    },

    // Llena select de categorias desde productos cargados
    _llenarCategorias() {
      if (!this.el.filtroCategoria) return;
      const set = new Set(this.productos.map(p => p.categoria).filter(Boolean));
      const opciones = ['<option value="">Todas las categorías</option>']
        .concat(Array.from(set).map(c => `<option value="${escapeAttr(c)}">${escapeHtml(c)}</option>`))
        .join('');
      this.el.filtroCategoria.innerHTML = opciones;
    },

    // Render del grid usando this.filtrados
    _render() {
      if (!this.el.productosLista) return;
      if (!Array.isArray(this.filtrados) || this.filtrados.length === 0) {
        this.el.productosLista.innerHTML = `
          <div class="col-12 text-center py-5">
            <p class="text-secondary">No se encontraron productos</p>
            <button class="btn btn-outline-light" onclick="limpiarFiltros()">Ver todos</button>
          </div>`;
        return;
      }

      // construir HTML
      this.el.productosLista.innerHTML = this.filtrados.map(p => `
        <div class="col-sm-6 col-md-4 col-lg-3 mb-3">
          <div class="card bg-secondary text-light h-100 product-card">
            <img src="${escapeAttr(p.imagen || p.imagen)}" class="card-img-top" alt="${escapeAttr(p.nombre)}" onerror="this.src='../img/placeholder.png'">
            <div class="card-body d-flex flex-column">
              <h5 class="card-title">${escapeHtml(p.nombre)}</h5>
              <span class="badge bg-primary mb-2">${escapeHtml(p.categoria)}</span>
              <p class="precio fw-bold mb-2">${formatCLP(p.precio)}</p>
              <div class="mt-auto d-grid gap-2">
                <button class="btn btn-outline-light btn-add-cart" data-id="${escapeAttr(p.id)}">Agregar al carrito</button>
                <a class="btn btn-outline-light" href="product.html?cod=${encodeURIComponent(p.id)}">Ver detalle</a>
              </div>
            </div>
          </div>
        </div>
      `).join('');
    },

    // Aplica filtros combinados y re-render
    applyFilters() {
      let res = [...this.productos];
      const f = this.filtros;

      if (f.category) {
        res = res.filter(p => p.categoria === f.category);
      }
      if (f.search && f.search.trim().length) {
        const s = f.search.trim().toLowerCase();
        res = res.filter(p =>
          (p.nombre || '').toLowerCase().includes(s) ||
          (p.descripcion || '').toLowerCase().includes(s)
        );
      }
      if (Number.isFinite(Number(f.minPrice))) {
        res = res.filter(p => Number(p.precio) >= Number(f.minPrice));
      }
      if (Number.isFinite(Number(f.maxPrice))) {
        res = res.filter(p => Number(p.precio) <= Number(f.maxPrice));
      }

      this.filtrados = res;
      this._render();
      return res;
    },

    // Buscar desde inputs (sin pasar parámetros)
    _onBuscarMain() {
      const val = (this.el.buscador && this.el.buscador.value) ? this.el.buscador.value : (this.el.buscadorHeader ? this.el.buscadorHeader.value : '');
      this.filtros.search = val || '';
      // sincronizar inputs si existen
      if (this.el.buscador && this.el.buscadorHeader) this.el.buscadorHeader.value = this.el.buscador.value;
      this.applyFilters();
    },

    // Agregar producto al carrito (incrementa cantidad si ya existe)
    agregarAlCarrito(productId) {
      const prod = this.productos.find(p => p.id === productId);
      if (!prod) return;
      if (typeof prod.stock === 'number' && prod.stock <= 0) {
        this._notify(`"${prod.nombre}" sin stock`);
        return;
      }

      const existing = this.carrito.find(i => i.id === productId);
      if (existing) {
        existing.cantidad = (existing.cantidad || 1) + 1;
      } else {
        this.carrito.push({
          id: prod.id,
          nombre: prod.nombre,
          precio: prod.precio,
          imagen: prod.imagen,
          cantidad: 1
        });
      }

      // persistir
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.carrito));
      this._actualizarBadge();
      this._notify(`"${prod.nombre}" agregado al carrito`);
    },

    // Actualiza badge: "cantidad | $total CLP"
    _actualizarBadge() {
      if (!this.el.badgeCarrito) return;
      const cantidad = this.carrito.reduce((s, it) => s + (it.cantidad || 0), 0);
      const total = this.carrito.reduce((s, it) => s + (Number(it.precio || 0) * (it.cantidad || 1)), 0);
      this.el.badgeCarrito.textContent = `${cantidad} | ${formatCLP(total)}`;

      // pulso visual
      this.el.badgeCarrito.classList.add('carrito-updated');
      setTimeout(() => this.el.badgeCarrito.classList.remove('carrito-updated'), 450);
    },

    // Mostrar todos / limpiar filtros
    mostrarTodos() {
      this.filtros = { search: '', category: '', minPrice: null, maxPrice: null };
      if (this.el.buscador) this.el.buscador.value = '';
      if (this.el.buscadorHeader) this.el.buscadorHeader.value = '';
      if (this.el.filtroCategoria) this.el.filtroCategoria.value = '';
      if (this.el.filtroMin) this.el.filtroMin.value = '';
      if (this.el.filtroMax) this.el.filtroMax.value = '';
      this.filtrados = [...this.productos];
      this._render();
    },

    // Notificación breve en pantalla
    _notify(msg) {
      const n = document.createElement('div');
      n.style.cssText = 'position:fixed;right:20px;top:100px;background:#28a745;color:#fff;padding:10px 14px;border-radius:8px;z-index:9999;font-weight:600';
      n.textContent = msg;
      document.body.appendChild(n);
      setTimeout(() => n.remove(), 1800);
    }
  }; // end Catalogo

  // ---------- Helpers ----------
  function escapeHtml(s) {
    if (!s && s !== 0) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
  function escapeAttr(s) {
    return escapeHtml(s).replace(/"/g, '&quot;');
  }
  function slugify(t) {
    return String(t || '').toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9\-]/g, '');
  }
  function formatCLP(n) {
    if (!isFinite(Number(n))) return '$0 CLP';
    return '$' + Number(n).toLocaleString('es-CL') + ' CLP';
  }

  // Exponer API globales
  window.Catalogo = Catalogo;
  window.mostrarTodos = () => Catalogo.mostrarTodos();
  window.limpiarFiltros = () => Catalogo.mostrarTodos();

  // Handler: cuando React o cualquier loader expone window.PRODUCTOS/window.catalogo, emitir evento 'productos-loaded'
  // Se provee un listener para recargar productos si este evento ocurre después de la carga inicial.
  async function onProductosLoadedHandler() {
    try {
      if (window.Catalogo && typeof window.Catalogo.cargarProductos === 'function') {
        await window.Catalogo.cargarProductos();
        // actualizar UI
        if (typeof window.Catalogo._llenarCategorias === 'function') window.Catalogo._llenarCategorias();
        if (typeof window.Catalogo._render === 'function') window.Catalogo._render();
        if (typeof window.Catalogo._actualizarBadge === 'function') window.Catalogo._actualizarBadge();
      }
    } catch (err) {
      console.error('productos-loaded handler error:', err);
    }
  }
  window.addEventListener('productos-loaded', onProductosLoadedHandler);

  // Polling opcional: si React tarda y no quieres tocar React, reintentar cargar productos unos segundos después
  // (esto complementa el evento; es un fallback ligero)
  async function _tryReloadIfEmpty(timeout = 3000) {
    // si ya hay productos cargados, salir
    if (Catalogo.productos && Catalogo.productos.length) return;
    const start = Date.now();
    while (Date.now() - start < timeout) {
      if ((window.catalogo && window.catalogo.length) || (window.PRODUCTOS && window.PRODUCTOS.length)) {
        // disparar handler para procesarlos
        await onProductosLoadedHandler();
        return;
      }
      // esperar 200ms
      await new Promise(r => setTimeout(r, 200));
    }
  }

  // Auto-init on DOMContentLoaded: intenta inicializar en modo 'auto' (usará firebase si config existe)
  document.addEventListener('DOMContentLoaded', () => {
    const cfg = window.firebaseConfigApp || null;
    const mode = cfg ? 'firebase' : 'auto';
    Catalogo.init({ mode, firebaseConfig: cfg, collectionName: 'producto' })
      .then(() => {
        // Si no se cargaron productos, reintentar por un breve período (para React loader timing)
        if (!Catalogo.productos || Catalogo.productos.length === 0) {
          _tryReloadIfEmpty(3500).catch(() => {});
        }
      })
      .catch(err => {
        console.warn('Catalogo init warning:', err && err.message ? err.message : err);
        // intentar fallback reintento
        _tryReloadIfEmpty(3500).catch(() => {});
      });
  });

})(window, document);