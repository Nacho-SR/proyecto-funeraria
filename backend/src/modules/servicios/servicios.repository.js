/*
  Acceso a Firestore para la colección servicios.
*/
import { db, admin } from '../../config/firebase.js'
import { ApiError } from '../../shared/utils/apiError.js'

export class ServiciosRepository {
  /**
   * Baja lógica: marca activo en false. No elimina el documento.
   */
  async darBajaLogica (servicioId) {
    const ref = db.collection('servicios').doc(servicioId)
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

    return { servicioID: servicioId, activo: false }
  }
}
