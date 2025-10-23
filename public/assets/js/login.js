<<<<<<< Updated upstream
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("formLogin");
    const correoInput = document.getElementById("correoLogin");
    const claveInput = document.getElementById("claveLogin");
    const mensaje = document.getElementById("mensajeLogin");

    if (!form) return console.error("No se encontró #formLogin");

    // Inicializar Firebase
    const firebaseConfig = {
        apiKey: "AIzaSyCbVcEwCAFPJcvDwTCJnqtnyVJc4asYTHo",
        authDomain: "tiendalevelup-ccd23.firebaseapp.com",
        projectId: "tiendalevelup-ccd23",
        storageBucket: "tiendalevelup-ccd23.firebasestorage.app",
        messagingSenderId: "788122901795",
        appId: "1:788122901795:web:1feabe6474cd2b44ef4096",
        measurementId: "G-QHQ3RM5FD8"
      };

    if (!firebase.apps?.length) {
        firebase.initializeApp(firebaseConfig);
    } 

    const auth = firebase.auth();
    const db = firebase.firestore();

    form.addEventListener("submit", async (e) => {
    e.preventDefault();
    mensaje.innerText = "";

    const correo = correoInput.value.trim().toLowerCase();
    const clave = claveInput.value;

    if (!correo || !clave) {
        mensaje.style.color = "red";
        mensaje.innerText = "Debes completar correo y clave";
        return;
    }

    // Admin: autenticar con Firebase Auth
    if (correo === "admin@duoc.cl") {
        try {
            await auth.signInWithEmailAndPassword(correo, clave);
            // Guardar usuario en localStorage
            const usuario = { nombre: "Administrador", correo, rol: "admin" };
            localStorage.setItem("usuario", JSON.stringify(usuario));

            mensaje.style.color = "green";
            mensaje.innerText = "Bienvenido Administrador, redirigiendo...";
            setTimeout(() => {
                window.location.href = `perfilAdmin.html`;
            }, 1000);
        } catch (error) {
            console.error("Error login admin:", error);
            mensaje.style.color = "red";
            mensaje.innerText = "Credenciales incorrectas para administrador";
        }
        return;
    }

    // Cliente: validar desde Firestore
    try {
        const query = await db.collection("usuario")
            .where("correo", "==", correo)
            .where("clave", "==", clave)
            .get();

        if (!query.empty) {
            const userData = query.docs[0].data();
            const nombre = userData.nombre || correo;

            // Guardar usuario en localStorage con rol real
            const usuario = { nombre, correo, rol: "cliente" };
            localStorage.setItem("usuario", JSON.stringify(usuario));

            mensaje.style.color = "green";
            mensaje.innerText = "Bienvenido cliente, redirigiendo...";
            setTimeout(() => {
                window.location.href = `perfilCliente.html`;
            }, 1000);
        } else {
            mensaje.style.color = "red";
            mensaje.innerText = "Correo o clave incorrectos";
        }
    } catch (error) {
        console.error("Error login cliente:", error);
        mensaje.style.color = "red";
        mensaje.innerText = "Error al verificar usuario";
    }
});
=======
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("loginForm");
    const correoInput = document.getElementById("correoLogin");
    const claveInput = document.getElementById("claveLogin");
    const mensaje = document.getElementById("mensajeLogin");

    if (!form) return console.error("No se encontró #loginForm");

    const firebaseConfig = {
        apiKey: "AIzaSyCbVcEwCAFPJcvDwTCJnqtnyVJc4asYTHo",
        authDomain: "tiendalevelup-ccd23.firebaseapp.com",
        projectId: "tiendalevelup-ccd23",
        storageBucket: "tiendalevelup-ccd23.firebasestorage.app",
        messagingSenderId: "788122901795",
        appId: "1:788122901795:web:1feabe6474cd2b44ef4096",
        measurementId: "G-QHQ3RM5FD8"
      };

    if (!firebase.apps?.length) {
        firebase.initializeApp(firebaseConfig);
    }

    const auth = firebase.auth();
    const db = firebase.firestore();

    form.addEventListener("submit", async (e) => {
    e.preventDefault();
    mensaje.innerText = "";

    const correo = correoInput.value.trim().toLowerCase();
    const clave = claveInput.value;

    if (!correo || !clave) {
        mensaje.style.color = "red";
        mensaje.innerText = "Debes completar correo y clave";
        return;
    }

    if (correo === "admin@levelup.cl") {
        try {
            await auth.signInWithEmailAndPassword(correo, clave);
            const usuario = { nombre: "Administrador", correo, rol: "admin" };
            localStorage.setItem("usuario", JSON.stringify(usuario));

            mensaje.style.color = "green";
            mensaje.innerText = "Bienvenido Administrador, redirigiendo...";
            setTimeout(() => {
                window.location.href = `perfilAdmin.html`;
            }, 1000);
        } catch (error) {
            console.error("Error login admin:", error);
            mensaje.style.color = "red";
            mensaje.innerText = "Credenciales incorrectas para administrador";
        }
        return;
    }

    try {
        const query = await db.collection("usuario")
            .where("correo", "==", correo)
            .where("clave", "==", clave)
            .get();

        if (!query.empty) {
            const userData = query.docs[0].data();
            const nombre = userData.nombre || correo;

            const usuario = { nombre, correo, rol: "cliente" };
            localStorage.setItem("usuario", JSON.stringify(usuario));

            mensaje.style.color = "green";
            mensaje.innerText = "Bienvenido cliente, redirigiendo...";
            setTimeout(() => {
                window.location.href = `perfilCliente.html`;
            }, 1000);
        } else {
            mensaje.style.color = "red";
            mensaje.innerText = "Correo o clave incorrectos";
        }
    } catch (error) {
        console.error("Error login cliente:", error);
        mensaje.style.color = "red";
        mensaje.innerText = "Error al verificar usuario";
    }
});
>>>>>>> Stashed changes
});