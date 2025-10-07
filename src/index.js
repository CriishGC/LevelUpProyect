import { addUser } from "./services/firestoreService";
import {validarCorreo, validarRun, esMayorEdad} from "./utils/script"

document.addEventListener("DOMContentLoaded", () =>{

 const form = document.getElementById("Formulario");
 const runInput = document.getElementById("Run");
 const nombreInput = document.getElementById("nombre");
 const correoInput = document.getElementById("correo");
 const claveInput = document.getElementById("clave");
 const fechaInput = document.getElementById("Fecha");
 const mensaje = document.getElementById("mensaje");

 if(!form) return console.error("No se encontro #FormUsuario")

 form.addEventListener("Submit", async(e) => {
  e.preventDefault();
  mensaje.innerText = "";
  const run = runInput.value.trim().ToUpperCase();
  const nombre = nombreInput.value.trim();
  const correo = correoInput.value.trim();
  const clave = claveInput.value;
  const fecha = fechaInput.value;

  if(!validarRun(run)) return mensaje.innerText = "RUN incorrecto";
  if(!nombre) return mensaje.innerText = "Nombre en blanco";
  if(!validarCorreo(correo)) return mensaje.innerText = "Correo incorrecto";
  if(!esMayorEdad(fecha)) return mensaje.innerText = "Debe ser mayor a 18 años";

  try{
   await addUser({run, nombre, correo, clave, fecha});
   mensaje.innerText = "Usuario envio con exito";
   setTimeout(() => {
    window.location.href =
    correo.toLowerCase() === "admin@duoc.cl"
    ? 'assets/page/perfilAdmin.html?nombre = ${endCodeERIComponent(nombre)}'
    : 'assets/page/perfilCliente.html?nombre = ${endCodeERIComponent(nombre)}'
   }, 1000 );
  }catch(error){

   console.error("Error al registrar usuario: ", error);

   mensaje.innerText = "Error al registrar usuario en fireBase"
  }
 }); 
});