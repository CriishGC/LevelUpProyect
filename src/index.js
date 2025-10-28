// js/script.js
// Importa addUser y las funciones de validación.
// AJUSTA la ruta del import según tu estructura de carpetas.
// Si este archivo se carga desde la carpeta `js/` y tu servicio está en `js/services/firestoreService.js`,
// entonces la ruta sería "./services/firestoreService.js".
import { addUser } from "./service/firestoreService.js";
import { validarCorreo, validarRun, esMayorEdad } from "./utils/script.js";

// Espera que el DOM esté listo
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formUsuario");
  const runInput = document.getElementById("run");
  const nombreInput = document.getElementById("nombre");
  const correoInput = document.getElementById("correo");
  const confirmarCorreoInput = document.getElementById("confirmarCorreo");
  const passwordInput = document.getElementById("password");
  const confirmarPasswordInput = document.getElementById("confirmarPassword");
  const telefonoInput = document.getElementById("telefono");
  const fechaInput = document.getElementById("fecha");
  const regionInput = document.getElementById("region");
  const comunaInput = document.getElementById("comuna");
  const mensaje = document.getElementById("mensaje");
  const submitButton = form?.querySelector('button[type="submit"]');

  if (!form) {
    console.warn("No se encontró #formUsuario");
    return;
  }

  function showMessage(text, type = "danger") {
    // type: "danger" o "success"
    mensaje.innerHTML = `<div class="alert alert-${type} p-2 mb-0">${text}</div>`;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    mensaje.innerText = "";
    if (submitButton) submitButton.disabled = true;

    // Tomar valores y normalizar
    const run = runInput.value.trim().toUpperCase();
    const nombre = nombreInput.value.trim();
    const correo = correoInput.value.trim().toLowerCase();
    const confirmarCorreo = confirmarCorreoInput?.value.trim().toLowerCase() || "";
    const clave = passwordInput.value;
    const confirmarClave = confirmarPasswordInput?.value || "";
    const fecha = fechaInput.value;
    const telefono = telefonoInput.value.trim();
    const region = regionInput.value;
    const comuna = comunaInput.value;

    // Validaciones
    if (!validarRun(run)) {
      showMessage("RUN (RUT) inválido.", "danger");
      if (submitButton) submitButton.disabled = false;
      return;
    }

    if (!nombre) {
      showMessage("El nombre no puede quedar vacío.", "danger");
      if (submitButton) submitButton.disabled = false;
      return;
    }

    if (!validarCorreo(correo)) {
      showMessage("Correo inválido.", "danger");
      if (submitButton) submitButton.disabled = false;
      return;
    }

    if (correo !== confirmarCorreo) {
      showMessage("Los correos no coinciden.", "danger");
      if (submitButton) submitButton.disabled = false;
      return;
    }

    if (clave.length < 6) {
      showMessage("La contraseña debe tener al menos 6 caracteres.", "danger");
      if (submitButton) submitButton.disabled = false;
      return;
    }

    if (clave !== confirmarClave) {
      showMessage("Las contraseñas no coinciden.", "danger");
      if (submitButton) submitButton.disabled = false;
      return;
    }

    if (!esMayorEdad(fecha)) {
      showMessage("Debes ser mayor de 18 años.", "danger");
      if (submitButton) submitButton.disabled = false;
      return;
    }

    if (!region) {
      showMessage("Selecciona una región.", "danger");
      if (submitButton) submitButton.disabled = false;
      return;
    }

    if (!comuna) {
      showMessage("Selecciona una comuna.", "danger");
      if (submitButton) submitButton.disabled = false;
      return;
    }

    // Preparar payload (NO guardes contraseñas en texto plano en producción).
    const payload = {
      run,
      nombre,
      correo,
      // En producción usa Firebase Auth para gestionar claves; aquí sólo para ejemplo:
      // clave,
      fecha,
      telefono,
      region,
      comuna,
      createdAt: new Date().toISOString()
    };

    console.log("[script.js] payload a enviar:", payload);
    try {
      await addUser(payload);
      showMessage("Formulario enviado correctamente.", "success");
      form.reset();

      // Redirección según correo (pequeña pausa para que el usuario vea el mensaje)
      setTimeout(() => {
        const destino =
          correo.toLowerCase() === "admin@duoc.cl"
            ? `assets/page/index_admin.html?nombre=${encodeURIComponent(nombre)}`
            : `assets/page/perfilUsuario.html?nombre=${encodeURIComponent(nombre)}`;
        window.location.href = destino;
      }, 900);
    } catch (error) {
      console.error("Error al guardar usuario:", error);
      // Si Firebase devuelve un código de error, mostrarlo ayuda a depurar
      const errMsg = error?.message || "Error al guardar usuario en Firebase.";
      showMessage(errMsg, "danger");
    } finally {
      if (submitButton) submitButton.disabled = false;
    }
  });
});