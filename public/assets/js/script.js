/* Script de validaciones + guardado en Firestore
   - Requiere Bootstrap 5 (para clases de validación)
   - Carga Firebase v10 modular por CDN (usa <script type="module">)
*/

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-app.js";
import { getFirestore, doc, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.14.0/firebase-firestore.js";

// (Opcional) si tienes una función addUser en otro archivo, impórtala así:
// import { addUser } from "./ruta/a/tu/servicio.js";

// 1) Configuración Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCbVcEwCAFPJcvDwTCJnqtnyVJc4asYTHo",
  authDomain: "tiendalevelup-ccd23.firebaseapp.com",
  projectId: "tiendalevelup-ccd23",
  storageBucket: "tiendalevelup-ccd23.appspot.com",
  messagingSenderId: "788122901795",
  appId: "1:788122901795:web:1feabe6474cd2b44ef4096",
  measurementId: "G-QHQ3RM5FD8",
};
const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

document.addEventListener("DOMContentLoaded", () => {
  const $ = (id) => document.getElementById(id);

  // --- Elementos del DOM ---
  const form              = $("formUsuario");
  const mensaje           = $("mensaje");

  const run               = $("run");
  const nombre            = $("nombre");
  const correo            = $("correo");
  const confirmarCorreo   = $("confirmarCorreo");
  const password          = $("password");
  const confirmarPassword = $("confirmarPassword");
  const telefono          = $("telefono");
  const fecha             = $("fecha");
  const region            = $("region");
  const comuna            = $("comuna");

  // --- Datos auxiliares ---
  const comunasPorRegion = {
    metropolitana: ["Santiago", "Providencia", "Las Condes", "Maipú", "Puente Alto"],
    valparaiso: ["Valparaíso", "Viña del Mar", "Quilpué", "Villa Alemana", "Quillota"],
    biobio: ["Concepción", "Talcahuano", "Chiguayante", "San Pedro de la Paz", "Coronel"],
  };

  // --- Utilidades de UI/validación ---
  function getOrCreateFeedbackEl(input) {
    const id = input.id + "Feedback";
    let fb = document.getElementById(id);
    if (!fb) {
      fb = document.createElement("div");
      fb.id = id;
      fb.className = "invalid-feedback";
      input.insertAdjacentElement("afterend", fb);
      const described = input.getAttribute("aria-describedby") || "";
      input.setAttribute("aria-describedby", (described + " " + id).trim());
    }
    return fb;
  }

  function setFieldState(input, ok, message = "") {
    const fb = getOrCreateFeedbackEl(input);
    if (ok) {
      input.classList.remove("is-invalid");
      input.classList.add("is-valid");
      fb.textContent = "";
    } else {
      input.classList.remove("is-valid");
      input.classList.add("is-invalid");
      fb.textContent = message;
    }
  }

  // --- RUN ---
  function normalizarRUN(value) {
    const clean = (value || "").replace(/\./g, "").replace(/\s+/g, "").toUpperCase();
    const match = clean.match(/^(\d{1,8})(-?)([\dK])$/i);
    if (!match) return null;
    const cuerpo = match[1];
    const dv = match[3];
    return { cuerpo, dv };
  }

  function calcularDV(cuerpo) {
    let suma = 0;
    let multiplicador = 2;
    for (let i = cuerpo.length - 1; i >= 0; i--) {
      suma += parseInt(cuerpo[i], 10) * multiplicador;
      multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
    }
    const resto = suma % 11;
    const dvCalc = 11 - resto;
    if (dvCalc === 11) return "0";
    if (dvCalc === 10) return "K";
    return String(dvCalc);
  }

  function validarRUN() {
    const raw = run.value;
    const norm = normalizarRUN(raw);
    if (!norm) {
      setFieldState(run, false, "Formato de RUN inválido. Ej: 12345678-K");
      return false;
    }
    const dvEsperado = calcularDV(norm.cuerpo);
    if (dvEsperado !== norm.dv) {
      setFieldState(run, false, "RUN inválido: dígito verificador no coincide.");
      return false;
    }
    setFieldState(run, true);
    run.value = `${norm.cuerpo}-${norm.dv}`;
    return true;
  }

  // --- Otras validaciones ---
  function validarNombre() {
    const val = (nombre.value || "").trim();
    if (val.length < 3) {
      setFieldState(nombre, false, "Ingresa al menos 3 caracteres.");
      return false;
    }
    if (!/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/.test(val)) {
      setFieldState(nombre, false, "Solo letras y espacios.");
      return false;
    }
    setFieldState(nombre, true);
    return true;
  }

  function validarCorreo() {
    const val = (correo.value || "").trim();
    const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
    if (!ok) {
      setFieldState(correo, false, "Correo inválido.");
      return false;
    }
    setFieldState(correo, true);
    if (confirmarCorreo.value) validarConfirmarCorreo();
    return true;
  }

  function validarConfirmarCorreo() {
    const val = (confirmarCorreo.value || "").trim();
    if (val !== (correo.value || "").trim()) {
      setFieldState(confirmarCorreo, false, "Los correos no coinciden.");
      return false;
    }
    setFieldState(confirmarCorreo, true);
    return true;
  }

  function validarPassword() {
    const val = password.value || "";
    if (val.length < 6) {
      setFieldState(password, false, "La contraseña debe tener al menos 6 caracteres.");
      return false;
    }
    setFieldState(password, true);
    if (confirmarPassword.value) validarConfirmarPassword();
    return true;
  }

  function validarConfirmarPassword() {
    if (confirmarPassword.value !== password.value) {
      setFieldState(confirmarPassword, false, "Las contraseñas no coinciden.");
      return false;
    }
    setFieldState(confirmarPassword, true);
    return true;
  }

  function validarTelefono() {
    const val = (telefono.value || "").replace(/\s+/g, "");
    if (!val) {
      telefono.classList.remove("is-invalid", "is-valid");
      return true; // opcional
    }
    const limpio = val.replace(/^\+56/, "");
    const soloDigitos = limpio.replace(/\D/g, "");
    if (soloDigitos.length < 9 || soloDigitos.length > 10) {
      setFieldState(telefono, false, "Teléfono inválido. Ej: +56912345678 o 912345678.");
      return false;
    }
    setFieldState(telefono, true);
    return true;
  }

  function calcularEdad(fechaISO) {
    const hoy = new Date();
    const nac = new Date(fechaISO);
    let edad = hoy.getFullYear() - nac.getFullYear();
    const m = hoy.getMonth() - nac.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nac.getDate())) edad--;
    return edad;
  }

  function validarFecha() {
    const val = fecha.value;
    if (!val) {
      setFieldState(fecha, false, "Selecciona tu fecha de nacimiento.");
      return false;
    }
    const edad = calcularEdad(val);
    if (isNaN(edad)) {
      setFieldState(fecha, false, "Fecha inválida.");
      return false;
    }
    if (edad < 18) {
      setFieldState(fecha, false, "Debes ser mayor de 18 años.");
      return false;
    }
    setFieldState(fecha, true);
    return true;
  }

  function validarRegion() {
    const val = region.value;
    if (!val) {
      setFieldState(region, false, "Selecciona una región.");
      return false;
    }
    setFieldState(region, true);
    return true;
  }

  function validarComuna() {
    const val = comuna.value;
    if (!val) {
      setFieldState(comuna, false, "Selecciona una comuna.");
      return false;
    }
    setFieldState(comuna, true);
    return true;
  }

  function poblarComunas() {
    const selRegion = region.value;
    const opciones = comunasPorRegion[selRegion] || [];
    comuna.innerHTML = '<option value="">Seleccione una comuna</option>';
    for (const c of opciones) {
      const opt = document.createElement("option");
      opt.value = c.toLowerCase().replace(/\s+/g, "-"); // slug
      opt.textContent = c;
      comuna.appendChild(opt);
    }
    comuna.classList.remove("is-valid", "is-invalid");
  }

  // --- Listeners ---
  run.addEventListener("input", validarRUN);
  nombre.addEventListener("input", validarNombre);
  correo.addEventListener("input", validarCorreo);
  confirmarCorreo.addEventListener("input", validarConfirmarCorreo);
  password.addEventListener("input", validarPassword);
  confirmarPassword.addEventListener("input", validarConfirmarPassword);
  telefono.addEventListener("input", validarTelefono);
  fecha.addEventListener("change", validarFecha);
  region.addEventListener("change", () => {
    poblarComunas();
    validarRegion();
    validarComuna();
  });
  comuna.addEventListener("change", validarComuna);

  // --- Submit ---
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    mensaje.className = "";
    mensaje.textContent = "";

    const checks = [
      validarRUN(),
      validarNombre(),
      validarCorreo(),
      validarConfirmarCorreo(),
      validarPassword(),
      validarConfirmarPassword(),
      validarTelefono(),
      validarFecha(),
      validarRegion(),
      validarComuna(),
    ];

    if (!checks.every(Boolean)) {
      mensaje.className = "alert alert-danger";
      mensaje.textContent = "Por favor corrige los campos marcados en rojo.";
      const firstInvalid = form.querySelector(".is-invalid");
      if (firstInvalid) firstInvalid.focus();
      return;
    }

    // Datos limpios
    const runNormalizado = run.value; // 12345678-K
    const runId = runNormalizado.replace(/[^0-9K]/gi, ""); // 12345678K
    const nombreVal = nombre.value.trim();
    const correoVal = correo.value.trim().toLowerCase();

    // Si quieres guardar el nombre visible de la comuna además del slug:
    const comunaSlug = comuna.value;
    const comunaLabel = comuna.options[comuna.selectedIndex]?.text || "";

    const payload = {
      run: runNormalizado,
      nombre: nombreVal,
      correo: correoVal,
      fecha: fecha.value,
      region: region.value,
      comuna: comunaSlug,
      comunaLabel,
      telefono: telefono.value ? telefono.value.replace(/\s+/g, "") : null,
      // SOLO DEMO: no guardar contraseñas planas en producción
      clave: password.value,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      mensaje.className = "alert alert-info";
      mensaje.textContent = "Guardando…";

      // Guardar en Firestore
      await setDoc(doc(db, "usuarios", runId), payload, { merge: true });

      // (Opcional) si también quieres tu flujo addUser, descomenta e importa:
      // await addUser(payload);

      mensaje.className = "alert alert-success";
      mensaje.textContent = "Guardado correctamente. Redirigiendo…";

      // Redirección según correo
      setTimeout(() => {
        if (correoVal === "admin@duoc.cl") {
          window.location.href = `../page/login.html?nombre=${encodeURIComponent(nombreVal)}`;
        } else {
          window.location.href = `../../index.html?nombre=${encodeURIComponent(nombreVal)}`;
        }
      }, 800);

    } catch (err) {
      console.error("Firestore write error:", err);
      mensaje.className = "alert alert-danger";
      mensaje.textContent = "No se pudo guardar en Firestore: " + (err?.message || err);
    }
  });

  // Inicialización
  poblarComunas();
  console.log("Firebase projectId:", app.options.projectId);
});
