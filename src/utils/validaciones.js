export function validarCorreo(correo) {
    const regex = /^[\w.+-]+@(duoc\.cl|profesor\.duoc\.cl|gmail\.com)$/i;
    return regex.test(correo);
  }
  //Validación del run
  export function validarRun(run) {
    const regex = /^[0-9]{8}[0-9K]$/;
    return regex.test(run);
  }
  //Validación de edad minima 18 años
  export function esMayorEdad(fecha) {
    const hoy = new Date();
    const fechaNacimiento = new Date(fecha);

    let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
    const mes = hoy.getMonth() - fechaNacimiento.getMonth();

    if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNacimiento.getDate())) {
      edad --;
    }
    return edad >= 18;
  }