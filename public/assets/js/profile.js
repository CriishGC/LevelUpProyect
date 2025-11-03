import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";
import { getAuth, signOut } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-auth.js";

const firebaseConfig = {
  apiKey: "AIzaSyCbVcEwCAFPJcvDwTCJnqtnyVJc4asYTHo",
  authDomain: "tiendalevelup-ccd23.firebaseapp.com",
  projectId: "tiendalevelup-ccd23",
  storageBucket: "tiendalevelup-ccd23.appspot.com",
  messagingSenderId: "788122901795",
  appId: "1:788122901795:web:1feabe6474cd2b44ef4096",
  measurementId: "G-QHQ3RM5FD8"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function el(id) { return document.getElementById(id); }

function showNotLogged() {
  const main = document.querySelector('main') || document.body;
  const msg = document.createElement('div');
  msg.className = 'alert alert-warning text-center';
  msg.innerHTML = `No has iniciado sesión. <a href="/assets/page/login.html" class="alert-link">Inicia sesión</a> para ver tu perfil.`;
  main.innerHTML = '';
  main.appendChild(msg);
}

async function loadProfile() {
  const raw = localStorage.getItem('lvlup_user');
  if (!raw) return showNotLogged();

  let stored;
  try { stored = JSON.parse(raw); } catch (e) { return showNotLogged(); }

  const id = stored.id;
  let data = null;
  if (id) {
    try {
      const dref = doc(db, 'usuarios', id);
      const snap = await getDoc(dref);
      if (snap.exists()) data = snap.data();
    } catch (err) {
      console.error('Error leyendo usuario desde Firestore:', err);
    }
  }

  const perfil = {
    nombre: (data && data.nombre) || stored.nombre || '',
    correo: (data && data.correo) || stored.correo || '',
    nacimiento: (data && (data.nacimiento || data.fechaNacimiento)) || '',
    puntos: (data && (data.puntos ?? 0)) || (stored.puntos ?? 0),
    nivel: (data && data.nivel) || ''
  };

  if (el('perfil-nombre')) el('perfil-nombre').textContent = perfil.nombre || '-';
  if (el('perfil-correo')) el('perfil-correo').textContent = perfil.correo || '-';
  if (el('perfil-nacimiento')) el('perfil-nacimiento').textContent = perfil.nacimiento || '-';
  if (el('perfil-nivel')) el('perfil-nivel').textContent = perfil.nivel || '-';
  if (el('perfil-puntos')) el('perfil-puntos').textContent = perfil.puntos ?? 0;
  const isDuoc = (perfil.correo || '').toLowerCase().endsWith('@duoc.cl');
  if (el('perfil-duoc')) el('perfil-duoc').textContent = isDuoc ? 'Sí' : 'No';
  if (el('perfil-duoc-descuento')) el('perfil-duoc-descuento').textContent = isDuoc ? 'Sí, 20%' : 'No';

  const headerNombre = el('header-nombre-usuario');
  if (headerNombre) headerNombre.textContent = perfil.nombre || '';
}

document.addEventListener('DOMContentLoaded', () => {
  loadProfile();

  const btn = document.getElementById('btn-logout');
  if (btn) {
    btn.addEventListener('click', async () => {
      try {
        const auth = getAuth();
        if (auth) {
          try { await signOut(auth); } catch (e) { /* no crítico */ }
        }
      } catch (err) {
        console.debug('Auth no disponible o error al cerrar sesión:', err);
      }

      try { localStorage.removeItem('lvlup_user'); } catch (e) { /* ignorar */ }
      window.location.href = '/assets/page/login.html';
    });
  }
});