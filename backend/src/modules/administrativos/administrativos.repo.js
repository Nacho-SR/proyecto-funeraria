/*
  * Módulo de administrativos - Repositorio
*/

import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export const registrarCliente = async (datosCliente) => {
  try {
    const clientesRef = collection(db, "clientes");
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