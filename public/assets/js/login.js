/* login.js — Iniciar sesión usando datos guardados en Firestore
   - Solo pide correo + contraseña
   - Busca en colección "usuarios" (campo "correo" en minúsculas y "clave")
   - Redirige por "rol" guardado; fallback: admin si correo === admin@duoc.cl
   - Cargar con: <script type="module" src="../js/login.js"></script>
*/

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import {
  getFirestore, collection, query, where, limit, getDocs
} from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

// 1) Firebase
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
const db  = getFirestore(app);

// 2) Rutas por rol (ajusta a tu estructura real)
const RUTAS_POR_ROL = {
  admin  : "../page/index_admin.html",
  usuario: "../../index.html"
};

// 3) Helpers DOM
const $ = (id) => document.getElementById(id);
const setMsg = (type, text) => {
  const box = $("mensajeLogin");
  if (!box) return;
  box.className = `alert alert-${type}`;
  box.textContent = text;
};

// 4) Lógica de login con Firestore (usa datos guardados)
async function iniciarSesionConFirestore(correo, password) {
  const correoVal = (correo || "").trim().toLowerCase();
  const claveVal  = (password || "").trim();

  if (!correoVal || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correoVal)) {
    throw new Error("Correo inválido.");
  }
  if (!claveVal) {
    throw new Error("Debes ingresar tu contraseña.");
  }

  // Buscar usuario por correo
  const q = query(collection(db, "usuarios"), where("correo", "==", correoVal), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) throw new Error("No existe una cuenta con ese correo.");

  const docUser = snap.docs[0];
  const data = docUser.data();

  // Comparar contraseña (texto plano tal como se guardó en el registro DEMO)
  if (!data.clave || data.clave !== claveVal) throw new Error("Contraseña incorrecta.");

  // Si tienes campo "activo" y quieres bloquear:
  if (data.activo === "N" || data.activo === false) {
    throw new Error("Tu cuenta está inactiva. Contacta soporte.");
  }

  // Determinar rol desde BD o fallback por correo
  const rolDetectado = data.rol || (correoVal === "admin@duoc.cl" ? "admin" : "usuario");

  return {
    id: docUser.id,
    nombre: data.nombre || "",
    correo: data.correo || correoVal,
    rol: rolDetectado
  };
}

// 5) Guardar sesión (opcional)
function guardarSesion(usuario) {
  localStorage.setItem("lvlup_user", JSON.stringify({
    id: usuario.id,
    nombre: usuario.nombre,
    correo: usuario.correo,
    rol: usuario.rol
  }));
}

// 6) Submit del formulario
document.addEventListener("DOMContentLoaded", () => {
  const form = $("formLogin");
  const inputCorreo = $("correoLogin");
  const inputPass   = $("passwordLogin");

  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    setMsg("secondary", "Verificando credenciales…");

    try {
      const usuario = await iniciarSesionConFirestore(inputCorreo.value, inputPass.value);
      guardarSesion(usuario);
      setMsg("success", `Bienvenido, ${usuario.nombre || "usuario"}. Redirigiendo…`);

      // Redirección por rol
      const destino = RUTAS_POR_ROL[usuario.rol] || RUTAS_POR_ROL.usuario;
      setTimeout(() => { window.location.href = destino; }, 700);

    } catch (err) {
      console.error(err);
      setMsg("danger", err?.message || "No se pudo iniciar sesión.");
    }
  });

  // Debug
  console.log("Firebase projectId:", app.options.projectId);
});