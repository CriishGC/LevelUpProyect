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

function ensureMsgBox() {
  let box = $("mensajeLogin");
  if (!box) {
    const form = $("loginForm");
    box = document.createElement("div");
    box.id = "mensajeLogin";
    box.role = "alert";
    box.style.display = "none";
    form?.prepend(box);
  }
  return box;
}

const setMsg = (type, text) => {
  const box = ensureMsgBox();
  box.className = `alert alert-${type} mt-2`;
  box.textContent = text;
  box.style.display = "block";
};

function clearFieldErrors() {
  const correo = $("correo");
  const contrasena = $("contrasena");
  const correoError = $("correoError");
  const contrasenaError = $("contrasenaError");

  correo?.classList.remove("is-invalid");
  contrasena?.classList.remove("is-invalid");
  if (correoError) correoError.textContent = "";
  if (contrasenaError) contrasenaError.textContent = "";
}

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

  const q = query(collection(db, "usuarios"), where("correo", "==", correoVal), limit(1));
  const snap = await getDocs(q);
  if (snap.empty) throw new Error("No existe una cuenta con ese correo.");

  const docUser = snap.docs[0];
  const data = docUser.data();

  if (!data.clave || data.clave !== claveVal) throw new Error("Contraseña incorrecta.");

  if (data.activo === "N" || data.activo === false) {
    throw new Error("Tu cuenta está inactiva. Contacta soporte.");
  }

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
  const form        = $("loginForm");
  const inputCorreo = $("correo");
  const inputPass   = $("contrasena");
  const correoError = $("correoError");
  const passError   = $("contrasenaError");
  const submitBtn   = form?.querySelector('button[type="submit"]');

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      clearFieldErrors();
      setMsg("secondary", "Verificando credenciales…");

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Ingresando…";
      }

      try {
        const usuario = await iniciarSesionConFirestore(inputCorreo.value, inputPass.value);
        guardarSesion(usuario);
        setMsg("success", `Bienvenido, ${usuario.nombre || "usuario"}. Redirigiendo…`);

        const destino = RUTAS_POR_ROL[usuario.rol] || RUTAS_POR_ROL.usuario;
        setTimeout(() => { window.location.href = destino; }, 700);

      } catch (err) {
        console.error(err);
        const msg = err?.message || "No se pudo iniciar sesión.";
        setMsg("danger", msg);

        // Marcar campos según el error
        if (msg.includes("Correo inválido")) {
          inputCorreo?.classList.add("is-invalid");
          if (correoError) correoError.textContent = "Ingresa un correo válido.";
        } else if (msg.includes("Debes ingresar tu contraseña")) {
          inputPass?.classList.add("is-invalid");
          if (passError) passError.textContent = "La contraseña es obligatoria.";
        } else if (msg.includes("No existe una cuenta")) {
          inputCorreo?.classList.add("is-invalid");
          if (correoError) correoError.textContent = "No existe una cuenta con ese correo.";
        } else if (msg.includes("Contraseña incorrecta")) {
          inputPass?.classList.add("is-invalid");
          if (passError) passError.textContent = "Contraseña incorrecta.";
        }
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = "Iniciar sesión";
        }
      }
    });
  } else {
    console.warn('No se encontró el formulario con id="loginForm". Verifica el HTML.');
  }

  // Handler "¿Olvidaste tu contraseña?"
  const btnForgot = $("sendForgot");
  const forgotEmail = $("forgotEmail");
  const forgotEmailError = $("forgotEmailError");
  const forgotMessage = $("forgotMessage");

  if (btnForgot) {
    btnForgot.addEventListener("click", () => {
      const email = (forgotEmail?.value || "").trim().toLowerCase();
      forgotEmailError.textContent = "";
      forgotEmail.classList.remove("is-invalid");

      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        forgotEmail.classList.add("is-invalid");
        forgotEmailError.textContent = "Ingresa un correo válido.";
        return;
      }

      // Aquí iría tu flujo real de recuperación (Auth/Backend). Por ahora mostramos feedback.
      if (forgotMessage) {
        forgotMessage.style.display = "block";
      }
    });
  }

  // Debug
  console.log("Firebase projectId:", app.options.projectId);
});