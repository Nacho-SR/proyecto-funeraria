/*
  Acceso a Firestore para la colección contratos.
*/
import { db, admin } from '../../config/firebase.js'
import { ApiError } from '../../shared/utils/apiError.js'

export class ContratosRepository {
  async listar () {
    const snapshot = await db.collection('contratos').get()

    return snapshot.docs.map(doc => {
      const contrato = doc.data()
      return {
        contratoID: doc.id,
        contrato_id: doc.id,
        contratos_id: doc.id,
        numContrato: contrato.num_contrato ?? '',
        num_contrato: contrato.num_contrato ?? '',
        id_cliente: contrato.clientes_id ?? contrato.cliente_id ?? '',
        id_paquete: contrato.paquetes_id ?? contrato.paquete_id ?? '',
        fechaInicio: this.fechaParaVista(contrato.fecha_inicio),
        frecuenciaPago: contrato.frecuencia_pago ?? '',
        precioTotal: contrato.precio_final ?? contrato.precioTotal ?? 0,
        estado: contrato.estado ?? 'activo',
        activo: contrato.activo !== false
      }
    })
  }

  fechaParaVista (fecha) {
    if (!fecha) return null
    if (fecha.toDate) return fecha.toDate().toISOString()
    if (fecha.seconds || fecha._seconds) {
      return new Date((fecha.seconds ?? fecha._seconds) * 1000).toISOString()
    }
    return fecha
  }

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
