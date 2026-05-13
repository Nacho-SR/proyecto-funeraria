import { db } from "../config/firebase.js";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

/**
 * Registra un nuevo cliente en la colección 'clientes'
 * @param {Object} datosCliente - Objeto con la información del formulario
 */
export const registrarCliente = async (datosCliente) => {
  try {
    // Referencia a la colección definida en tu diagrama
    const clientesRef = collection(db, "clientes");

    // Estructura basada en tu diagrama de base de datos
    const nuevoCliente = {
      nombre: datosCliente.nombre,
      apaterno: datosCliente.apaterno,
      amaterno: datosCliente.amaterno,
      telefono: datosCliente.telefono,
      email: datosCliente.email,
      calle: datosCliente.calle,
      colonia: datosCliente.colonia,
      numCasa: datosCliente.numCasa,
      usuarioID: datosCliente.usuarioID, 
      fechaCreacion: serverTimestamp(),  
      actualizadoPor: datosCliente.usuarioID,
      fechaActualizacion: serverTimestamp()
    };

    const docRef = await addDoc(clientesRef, nuevoCliente);
    
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Error en API alta clientes:", error);
    return { success: false, error: error.message };
  }
};