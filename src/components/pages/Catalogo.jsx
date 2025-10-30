import { useEffect } from "react";
import { db } from "../../service/firebase";

const CatalogoLoader = () => {
  useEffect(() => {
    const cargarProductos = async () => {
      try {
        const snapshot = await db.collection("producto").get();
        const productos = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        // Exponer para el HTML/JS tradicional
        window.catalogo = productos;    // ya lo hacías
        window.PRODUCTOS = productos;   // añadir compatibilidad con el script que busca window.PRODUCTOS
        console.log("Productos cargados desde Firestore:", productos.length);
      } catch (err) {
        console.error("Error al cargar productos:", err);
      }
    };

    cargarProductos();
  }, []);

  return null; // No renderiza nada
};

export default CatalogoLoader;