/*
  Acceso a Firestore para la colección servicios.
*/
import { db, admin } from '../../config/firebase.js'
import { ApiError } from '../../shared/utils/apiError.js'

export class ServiciosRepository {
  async listar () {
    const snapshot = await db.collection('adicionales').get()

    return snapshot.docs.map(doc => {
      const servicio = doc.data()
      return {
        servicioID: doc.id,
        servicio_id: doc.id,
        adicional_id: doc.id,
        servicios_id: doc.id,
        nombre: servicio.nombre ?? '',
        descripcion: servicio.descripcion ?? '',
        precio: servicio.precio ?? 0,
        activo: servicio.activo !== false
      }
    })
  }

  /**
   * Baja lógica: marca activo en false. No elimina el documento.
   * Usa la colección adicionales (servicios del catálogo).
   */
  async darBajaLogica (servicioId) {
    const ref = db.collection('adicionales').doc(servicioId)
    const snap = await ref.get()

    if (!snap.exists) {
      throw new ApiError(404, 'Servicio no encontrado')
    }

    const datos = snap.data()
    if (datos.activo === false) {
      throw new ApiError(409, 'El servicio ya está dado de baja')
    }

    await ref.update({
      activo: false,
      fecha_modificacion: admin.firestore.FieldValue.serverTimestamp()
    })

    return { servicioID: servicioId, adicional_id: servicioId, activo: false }
  }
}
