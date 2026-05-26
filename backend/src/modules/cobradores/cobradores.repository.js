import { admin, db } from '../../config/firebase.js'
import { ApiError } from '../../shared/utils/apiError.js'

const SERVER_TIMESTAMP = admin.firestore.FieldValue.serverTimestamp

export class CobradoresRepository {
  async findCobradorByUsuarioId(usuariosId) {
    const snapshot = await db.collection('cobradores')
      .where('usuarios_id', '==', usuariosId)
      .limit(1)
      .get()

    if (snapshot.empty) return null
    const doc = snapshot.docs[0]
    return { cobradores_id: doc.id, ...doc.data() }
  }

  async listarRutasPorCobrador(cobradorId) {
    const snapshot = await db.collection('ruta_cobros')
      .where('cobradores_id', '==', cobradorId)
      .get()

    const rutasActivas = snapshot.docs.filter(doc => doc.data().activo !== false)
    const rutas = await Promise.all(rutasActivas.map(async doc => {
      const ruta = { ruta_cobros_id: doc.id, ...doc.data() }
      const resumen = await this.resumenDetallesRuta(ruta)
      return { ...ruta, resumen }
    }))

    return rutas.sort((a, b) => String(b.fecha_inicio ?? '').localeCompare(String(a.fecha_inicio ?? '')))
  }

  async obtenerRutaConDetalles(cobradorId, rutaId) {
    const rutaRef = db.collection('ruta_cobros').doc(rutaId)
    const rutaDoc = await rutaRef.get()

    if (!rutaDoc.exists) {
      throw new ApiError(404, 'Ruta de cobro no encontrada')
    }

    const ruta = { ruta_cobros_id: rutaDoc.id, ...rutaDoc.data() }
    this.validarRutaDelCobrador(ruta, cobradorId)

    const detallesSnapshot = await db.collection('detalle_ruta_cobros')
      .where('ruta_cobros_id', '==', rutaId)
      .get()

    const detalles = await Promise.all(detallesSnapshot.docs.map(doc => this.detalleCompleto(doc)))
    detalles.sort((a, b) => Number(a.detalle.orden_visita ?? 0) - Number(b.detalle.orden_visita ?? 0))

    return {
      ...ruta,
      resumen: this.calcularResumen(detalles.map(item => item.detalle), this.cicloActual(ruta)),
      detalles
    }
  }

  async iniciarRuta(cobradorId, rutaId, usuariosId) {
    const rutaRef = db.collection('ruta_cobros').doc(rutaId)

    await db.runTransaction(async transaction => {
      const rutaDoc = await transaction.get(rutaRef)
      if (!rutaDoc.exists) throw new ApiError(404, 'Ruta de cobro no encontrada')

      const ruta = { ruta_cobros_id: rutaDoc.id, ...rutaDoc.data() }
      this.validarRutaDelCobrador(ruta, cobradorId)

      if (ruta.estado === 'completada') return
      if (ruta.estado !== 'en curso') {
        transaction.update(rutaRef, {
          estado: 'en curso',
          fecha_modificacion: SERVER_TIMESTAMP(),
          actualizado_por: usuariosId
        })
      }
    })

    return this.obtenerRutaConDetalles(cobradorId, rutaId)
  }

  async registrarResultado({ cobradorId, usuariosId, rutaId, detalleId, resultado, montoRecibido }) {
    const rutaRef = db.collection('ruta_cobros').doc(rutaId)
    const detalleRef = db.collection('detalle_ruta_cobros').doc(detalleId)
    const pagoRef = resultado === 'pagado' ? db.collection('pagos').doc() : null

    const registro = await db.runTransaction(async transaction => {
      const rutaDoc = await transaction.get(rutaRef)
      if (!rutaDoc.exists) throw new ApiError(404, 'Ruta de cobro no encontrada')

      const ruta = { ruta_cobros_id: rutaDoc.id, ...rutaDoc.data() }
      this.validarRutaDelCobrador(ruta, cobradorId)
      const cicloActual = this.cicloActual(ruta)

      const detalleDoc = await transaction.get(detalleRef)
      if (!detalleDoc.exists) throw new ApiError(404, 'Destino de cobro no encontrado')

      const detalle = { detalle_ruta_cobros_id: detalleDoc.id, ...detalleDoc.data() }
      if (detalle.ruta_cobros_id !== rutaId) {
        throw new ApiError(404, 'Destino de cobro no pertenece a la ruta indicada')
      }
      if (this.detalleRegistradoEnCiclo(detalle, cicloActual)) {
        throw new ApiError(409, 'Este destino ya fue registrado y no puede modificarse')
      }

      const contratoId = detalle.contratos_id ?? detalle.contrato_id
      if (!contratoId) {
        throw new ApiError(409, 'El destino no tiene contrato asignado')
      }

      const detallesSnapshot = await transaction.get(
        db.collection('detalle_ruta_cobros').where('ruta_cobros_id', '==', rutaId)
      )
      const rutaCompletada = detallesSnapshot.docs.every(doc => {
        if (doc.id === detalleId) return true
        const data = doc.data()
        return this.detalleRegistradoEnCiclo(data, cicloActual)
      })

      const updateDetalle = {
        ciclo: cicloActual,
        resultado,
        monto_recibido: montoRecibido,
        fecha_realizacion: SERVER_TIMESTAMP(),
        revisado: false,
        fecha_revision: null,
        revisado_por: null,
        fecha_modificacion: SERVER_TIMESTAMP(),
        actualizado_por: usuariosId
      }

      transaction.update(detalleRef, updateDetalle)

      let pago = null
      if (resultado === 'pagado') {
        pago = {
          contratos_id: contratoId,
          contrato_id: contratoId,
          monto: montoRecibido,
          estatus: 'por validar',
          cobradores_id: cobradorId,
          ruta_cobros_id: rutaId,
          detalle_ruta_cobros_id: detalleId,
          ciclo_ruta: cicloActual,
          creado_por: usuariosId,
          fechaPago: SERVER_TIMESTAMP(),
          fecha_creacion: SERVER_TIMESTAMP(),
          fecha_modificacion: SERVER_TIMESTAMP()
        }
        transaction.set(pagoRef, pago)
      }

      transaction.update(rutaRef, {
        estado: rutaCompletada ? 'completada' : 'en curso',
        fecha_modificacion: SERVER_TIMESTAMP(),
        actualizado_por: usuariosId
      })

      return {
        detalle: {
          ...detalle,
          ...updateDetalle
        },
        pago: pago ? { pagos_id: pagoRef.id, ...pago } : null,
        rutaCompletada
      }
    })

    return {
      ...registro,
      ruta: await this.obtenerRutaConDetalles(cobradorId, rutaId)
    }
  }

  async resumenDetallesRuta(ruta) {
    const snapshot = await db.collection('detalle_ruta_cobros')
      .where('ruta_cobros_id', '==', ruta.ruta_cobros_id)
      .get()

    return this.calcularResumen(snapshot.docs.map(doc => doc.data()), this.cicloActual(ruta))
  }

  calcularResumen(detalles, cicloActual) {
    const total = detalles.length
    const detallesCiclo = detalles.filter(detalle => Number(detalle.ciclo ?? 0) === cicloActual)
    const completados = detallesCiclo.filter(detalle => detalle.resultado || detalle.fecha_realizacion).length
    const pagados = detallesCiclo.filter(detalle => detalle.resultado === 'pagado').length
    const pospuestos = detallesCiclo.filter(detalle => detalle.resultado === 'pospuesto').length
    const noEncontrados = detallesCiclo.filter(detalle => detalle.resultado === 'NE').length
    const montoRecibido = detallesCiclo.reduce((totalMonto, detalle) => totalMonto + Number(detalle.monto_recibido ?? 0), 0)

    return {
      total,
      completados,
      pendientes: total - completados,
      pagados,
      pospuestos,
      no_encontrados: noEncontrados,
      monto_recibido: montoRecibido
    }
  }

  cicloActual(ruta) {
    return Number(ruta.ciclo_actual ?? 1)
  }

  detalleRegistradoEnCiclo(detalle, cicloActual) {
    return Number(detalle.ciclo ?? 0) === cicloActual && Boolean(detalle.resultado || detalle.fecha_realizacion)
  }

  async detalleCompleto(detalleDoc) {
    const detalle = { detalle_ruta_cobros_id: detalleDoc.id, ...detalleDoc.data() }
    const contratoId = detalle.contratos_id ?? detalle.contrato_id
    const direccionCobroId = detalle.direccion_cobro_id ?? detalle.direcciones_cobro_id

    const [contratoDoc, direccionDoc] = await Promise.all([
      contratoId ? db.collection('contratos').doc(contratoId).get() : null,
      direccionCobroId ? db.collection('direcciones_cobro').doc(direccionCobroId).get() : null
    ])

    const contrato = contratoDoc?.exists
      ? { contratos_id: contratoDoc.id, ...contratoDoc.data() }
      : null

    const cliente = contrato?.clientes_id
      ? await this.clienteConUsuario(contrato.clientes_id)
      : null

    const direccionCobro = direccionDoc?.exists
      ? { direcciones_cobro_id: direccionDoc.id, ...direccionDoc.data() }
      : null

    return {
      detalle,
      contrato,
      cliente,
      direccion_cobro: direccionCobro
    }
  }

  async clienteConUsuario(clienteId) {
    const clienteDoc = await db.collection('clientes').doc(clienteId).get()
    if (!clienteDoc.exists) return null

    const cliente = { clientes_id: clienteDoc.id, ...clienteDoc.data() }
    const usuarioDoc = cliente.usuarios_id
      ? await db.collection('usuarios').doc(cliente.usuarios_id).get()
      : null

    const usuario = usuarioDoc?.exists
      ? {
          usuarios_id: usuarioDoc.id,
          nombre: usuarioDoc.data().nombre,
          apaterno: usuarioDoc.data().apaterno,
          amaterno: usuarioDoc.data().amaterno,
          email: usuarioDoc.data().email
        }
      : null

    return { cliente, usuario }
  }

  validarRutaDelCobrador(ruta, cobradorId) {
    if (ruta.cobradores_id !== cobradorId) {
      throw new ApiError(403, 'No tienes permiso para consultar esta ruta')
    }
    if (ruta.activo === false) {
      throw new ApiError(404, 'Ruta de cobro inactiva')
    }
  }

  async darBajaLogica(cobradorId) {
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
      fecha_modificacion: SERVER_TIMESTAMP()
    })

    return { cobradorID: cobradorId, activo: false }
  }
}
