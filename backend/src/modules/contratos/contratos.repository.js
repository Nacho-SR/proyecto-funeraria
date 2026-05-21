/*
  Acceso a Firestore para la colección contratos.
*/
import { db, admin } from '../../config/firebase.js'
import { ApiError } from '../../shared/utils/apiError.js'

export class ContratosRepository {
  /**
   * Baja lógica: marca inactivo y estado cancelado. No borra el documento.
   */
  async darBajaLogica (contratoId) {
    const ref = db.collection('contratos').doc(contratoId)
    const snap = await ref.get()

    if (!snap.exists) {
      throw new ApiError(404, 'Contrato no encontrado')
    }

    const datos = snap.data()
    if (datos.activo === false || datos.estado === 'cancelado') {
      throw new ApiError(409, 'El contrato ya está dado de baja')
    }

    await ref.update({
      activo: false,
      estado: 'cancelado',
      fecha_modificacion: admin.firestore.FieldValue.serverTimestamp()
    })

    return { contratoID: contratoId, activo: false, estado: 'cancelado' }
  }
}
