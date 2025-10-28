// src/services/firestoreService.js
import { db } from "../config/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function addUser(user) {
  console.log("[firestoreService] addUser llamado con payload:", user);

  try {
    const payload = {
      ...user,
      createdAt: serverTimestamp()
    };

    // Log antes de llamar a Firestore
    console.log("[firestoreService] llamando addDoc en colección 'usuario' con:", payload);
    const docRef = await addDoc(collection(db, "usuario"), payload);

    console.log("Usuario registrado con ID:", docRef.id);
    return docRef;
  } catch (error) {
    // Registro ampliado para diagnóstico
    console.error("[firestoreService] Error al registrar el usuario:");
    console.error("error.code:", error?.code);
    console.error("error.message:", error?.message);
    console.error("error:", error);
    throw error;
  }
}