/*
  Acceso a Firestore para la colección cobradores.
*/
import { db, admin } from '../../config/firebase.js'
import { ApiError } from '../../shared/utils/apiError.js'

export class CobradoresRepository {
  /**
   * Marca el cobrador como inactivo (baja lógica). No elimina el documento.
   */
  async darBajaLogica (cobradorId) {
    const ref = db.collection('cobradores').doc(cobradorId)
    const snap = await ref.get()

    if (!snap.exists) {
      throw new ApiError(404, 'Cobrador no encontrado')
    }

    const datos = snap.data()
    if (datos.activo === false) {
      throw new ApiError(409, 'El cobrador ya está dado de baja')
    }

    await ref.update({
      activo: false,
      fecha_modificacion: admin.firestore.FieldValue.serverTimestamp()
    })

    return { cobradorID: cobradorId, activo: false }
  }
}
