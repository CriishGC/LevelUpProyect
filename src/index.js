<<<<<<< Updated upstream
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
=======
import { addUser } from "./services/firestoreService";
import { validarCorreo, validarRun, esMayorEdad } from "./utils/script";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("Formulario");
  const runInput = document.getElementById("Run");
  const nombreInput = document.getElementById("nombre");
  const correoInput = document.getElementById("correo");
  const claveInput = document.getElementById("clave");
  const fechaInput = document.getElementById("Fecha");
  const mensaje = document.getElementById("mensaje");

  if (!form) return console.error("No se encontró #Formulario");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (mensaje) mensaje.innerText = "";

    const run = runInput.value.trim().toUpperCase();
    const nombre = nombreInput.value.trim();
    const correo = correoInput.value.trim();
    const clave = claveInput.value;
    const fecha = fechaInput.value;

    if (!validarRun(run)) return (mensaje.innerText = "RUN incorrecto");
    if (!nombre) return (mensaje.innerText = "Nombre en blanco");
    if (!validarCorreo(correo)) return (mensaje.innerText = "Correo incorrecto");
    if (!esMayorEdad(fecha)) return (mensaje.innerText = "Debe ser mayor a 18 años");

    try {
      await addUser({ run, nombre, correo, clave, fecha });
      mensaje.innerText = "Usuario enviado con éxito";

      setTimeout(() => {
        window.location.href =
          correo.toLowerCase() === "admin@duoc.cl"
            ? `assets/page/perfilAdmin.html?nombre=${encodeURIComponent(nombre)}`
            : `assets/page/perfilCliente.html?nombre=${encodeURIComponent(nombre)}`;
      }, 1000);
    } catch (error) {
      console.error("Error al registrar usuario: ", error);
      mensaje.innerText = "Error al registrar usuario en Firebase";
    }
  });
});
>>>>>>> Stashed changes
