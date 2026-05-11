import { db } from "../config/firebase.js";
import { registrarCliente } from "./administrativos.repo.js";

/**
 * Registra un nuevo cliente en la colección 'clientes'
 * @param {Object} datosCliente - Objeto con la información del formulario
 */
export const registrarCliente = async (datosCliente) => {

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

    const docRef = await registrarCliente(nuevoCliente);
    
    return { success: true, id: docRef.id };

};