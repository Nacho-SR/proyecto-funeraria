import { db } from "../config/firebase.js";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

/**
 * Registra un nuevo cliente en la colección 'paquetes'
 * @param {Object} datosServicio - Objeto con la información del formulario
 */
export const registrarServicio = async (datosServicio) => {
  try {
    const serviciosRef = collection(db, "paquetes");
    const nuevoServicio = {
      nombre: datosServicio.nombre,
      descripcion: datosServicio.descripcion,
      precioBase: datosServicio.precioBase,
      paqueteID: datosServicio.paqueteID,
      fechaCreacion: serverTimestamp()
    };

    const docRef = await addDoc(serviciosRef, nuevoServicio);
    
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error en API alta servicios:", error);
    return { success: false, error: error.message };
  }
};