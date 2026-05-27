import bcrypt from 'bcrypt'
import { admin } from '../../config/firebase.js'
import { ApiError } from '../../shared/utils/apiError.js'
import { AdministrativosRepository } from './administrativos.repository.js'

export class AdministrativosService {
  constructor () {
    this.repo = new AdministrativosRepository()
  }

  sanitizeUsuario (usuario) {
    const { password, ...safe } = usuario
    return safe
  }

  nombreCompleto ({ nombre, apaterno, amaterno }) {
    return `${nombre} ${apaterno} ${amaterno}`.trim()
  }

  calcularProximaFecha(fechaBase, periodicidad) {
    const segundos = fechaBase?.seconds ?? fechaBase?._seconds
    const fecha = fechaBase?.toDate
      ? fechaBase.toDate()
      : segundos
        ? new Date(segundos * 1000)
        : new Date(fechaBase)
    if (Number.isNaN(fecha.getTime())) {
      throw new ApiError(400, 'Fecha de ruta invalida')
    }

    const siguiente = new Date(fecha)
    if (periodicidad === 'semanal') {
      siguiente.setDate(siguiente.getDate() + 7)
    } else if (periodicidad === 'quincenal') {
      siguiente.setDate(siguiente.getDate() + 14)
    } else if (periodicidad === 'mensual') {
      siguiente.setMonth(siguiente.getMonth() + 1)
    } else {
      throw new ApiError(400, 'Periodicidad de ruta invalida')
    }

    return siguiente.toISOString().slice(0, 10)
  }

  async listarClientesActivos() {
    return await this.repo.listarClientesActivos()
  }

  async listarCobradoresActivos() {
    return await this.repo.listarCobradoresActivos()
  }

  async listarProductosActivos() {
    return await this.repo.listarProductosActivos()
  }

  async listarRutasCobro() {
    return await this.repo.listarRutasCobro()
  }

  async listarRutasCobroValidacion() {
    return await this.repo.listarRutasCobroValidacion()
  }

  async obtenerRutaCobroValidacion(rutaId) {
    const ruta = await this.repo.obtenerRutaCobroValidacion(rutaId)
    if (!ruta) {
      throw new ApiError(404, 'Ruta de cobro no encontrada')
    }
    return ruta
  }

  async obtenerDetallesCobro(rutaCobroId) {
    const rutaCobro = await this.repo.findRutaCobroById(rutaCobroId)
    if (!rutaCobro) {
      throw new ApiError(404, 'Ruta de cobro no encontrada')
    }
    const detalles = await this.repo.obtenerDetallesCobro(rutaCobroId)
    return detalles
  }

  async obtenerInfoContratos(){
    return await this.repo.obtenerInfoContratos()
  }

  async listarSolicitudesBeneficiarios() {
    return await this.repo.listarSolicitudesBeneficiarios()
  }

  async resumenSolicitudesBeneficiarios() {
    return await this.repo.resumenSolicitudesBeneficiarios()
  }

  async resolverSolicitudBeneficiario(solicitudId, data, usuarioId) {
    return await this.repo.resolverSolicitudBeneficiario({
      solicitudId,
      accion: data.accion,
      comentarioAdmin: data.comentario_admin ?? '',
      usuarioId
    })
  }

  /* Genera el siguiente num_documento con formato XX-XXXXX.
  * @param {string|null} ultimoNumDocumento - El último num_documento en la BD (ej. "25-00105"), o null si es el primero.
  * @param {Date|string|number} fechaCreacion - Fecha de creación del nuevo documento (para obtener el año).
  * @returns {string} Nuevo num_documento (ej. "26-00106").
  */
  async generarNuevoNumContrato(ultimoNumContrato, fechaCreacion) {
    // Obtener los dos últimos dígitos del año de creación
    const year = new Date(fechaCreacion).getFullYear().toString().slice(-2);

    // Si no hay documentos previos, empezamos la secuencia en 1
    if (!ultimoNumContrato) {
      return `${year}-00001`;
    }

    // Validar formato básico
    const partes = ultimoNumContrato.split('-');
    if (partes.length !== 2 || partes[1].length !== 5) {
      throw new Error('El último num_contrato no tiene el formato esperado (XX-XXXXX).');
    }

    const secuenciaActual = parseInt(partes[1], 10);
    if (isNaN(secuenciaActual)) {
      throw new Error('La parte secuencial no es un número válido.');
    }

    const nuevaSecuencia = secuenciaActual + 1;
    if (nuevaSecuencia > 99999) {
      throw new Error('Se ha alcanzado el límite de la secuencia (99999).');
    }

    const secuenciaStr = nuevaSecuencia.toString().padStart(5, '0');
    return `${year}-${secuenciaStr}`;
  }

  async crearNuevoCliente(data) {
    if (await this.repo.findUserByEmail(data.usuario.email)) {
      throw new ApiError(409, 'Usuario ya existe')
    }

    const passwordHash = await bcrypt.hash(data.usuario.password, 10)

    const usuario = {
      ...data.usuario,
      passwordHash,
      rol: 'cliente',
      activo: data.activo ?? true,
      fecha_creacion: admin.firestore.FieldValue.serverTimestamp(),
      fecha_modificacion: admin.firestore.FieldValue.serverTimestamp()
    }
    delete usuario.password

    const nuevoUsuario = await this.repo.crearUsuario(usuario)

    const cliente = {
      ...data.cliente,
      activo: data.activo ?? true,
      usuarios_id: nuevoUsuario.usuario_id,
      fecha_creacion: admin.firestore.FieldValue.serverTimestamp(),
      fecha_modificacion: admin.firestore.FieldValue.serverTimestamp()
    }
    const infoCliente = await this.repo.crearCliente(cliente)
    return { ...this.sanitizeUsuario(nuevoUsuario), ...infoCliente }
  }

  async crearNuevoCobrador(data) {
    if (await this.repo.findUserByEmail(data.usuario.email)) {
      throw new ApiError(409, 'Usuario ya existe')
    }

    const passwordHash = await bcrypt.hash(data.usuario.password, 10)

    const usuario = {
      ...data.usuario,
      passwordHash,
      rol: 'cobrador',
      activo: data.activo ?? true,
      fecha_creacion: admin.firestore.FieldValue.serverTimestamp(),
      fecha_modificacion: admin.firestore.FieldValue.serverTimestamp()
    }
    delete usuario.password
    const nuevoUsuario = await this.repo.crearUsuario(usuario)

    const cobrador = {
      ...data.cobrador,
      activo: data.activo ?? true,
      usuarios_id: nuevoUsuario.usuario_id,
      fecha_creacion: admin.firestore.FieldValue.serverTimestamp(),
      fecha_modificacion: admin.firestore.FieldValue.serverTimestamp()
    }
    const infoCobrador = await this.repo.crearCobrador(cobrador)
    return { ...this.sanitizeUsuario(nuevoUsuario), ...infoCobrador }
  }

  async obtenerCliente(id) {
    const cliente = await this.repo.obtenerClienteEdicion(id)
    if (!cliente) {
      throw new ApiError(404, 'Cliente no encontrado')
    }
    return cliente
  }

  async actualizarCliente(id, data) {
    const cliente = await this.repo.findClienteById(id)
    if (!cliente) {
      throw new ApiError(404, 'Cliente no encontrado')
    }
    return await this.repo.actualizarCliente(id, data)
  }

  async obtenerCobrador(id) {
    const cobrador = await this.repo.obtenerCobradorEdicion(id)
    if (!cobrador) {
      throw new ApiError(404, 'Cobrador no encontrado')
    }
    return cobrador
  }

  async obtenerServicio(id) {
    const servicio = await this.repo.obtenerServicioEdicion(id)
    if (!servicio) {
      throw new ApiError(404, 'Servicio no encontrado')
    }
    return servicio
  }

  async actualizarServicio(id, data) {
    const servicio = await this.repo.findAdicionalById(id)
    if (!servicio) {
      throw new ApiError(404, 'Servicio no encontrado')
    }
    return await this.repo.actualizarServicio(id, data)
  }

  async actualizarCobrador(id, data) {
    const cobrador = await this.repo.findCobradorById(id)
    if (!cobrador) {
      throw new ApiError(404, 'Cobrador no encontrado')
    }
    return await this.repo.actualizarCobrador(id, data)
  }

  async crearNuevoContrato(data) {
    if (!data.clientes_id && !data.nuevo_cliente) {
      throw new ApiError(400, 'Debe proporcionar clientes_id o nuevo_cliente')
    }
    if (data.nuevo_cliente) {
      const nuevoCliente = await this.crearNuevoCliente(data.nuevo_cliente)
      data.clientes_id = nuevoCliente.cliente_id
      console.log('Nuevo cliente creado con ID:', data.clientes_id)
      delete data.nuevo_cliente
    }

    const ultimoNumero = await this.repo.buscarUltimoNumeroContrato()
    const nuevoNumContrato = await this.generarNuevoNumContrato(ultimoNumero, new Date())

    const paqueteSnap = await this.repo.findPaqueteById(data.paquetes_id)
    if (!paqueteSnap) {
      throw new ApiError(404, 'Paquete no encontrado, no se puede crear contrato')
    }

    let precioFinal = paqueteSnap.precio_base
    let adicionalesInfo = data.adicionales
    let beneficiariosInfo = data.beneficiarios
    let direccionCobroInfo = data.direccion_cobro
    delete data.adicionales
    delete data.beneficiarios
    delete data.direccion_cobro

    if (adicionalesInfo && adicionalesInfo.length > 0) {
      for (const adicional of adicionalesInfo) {
        const adicionalSnap = await this.repo.findAdicionalById(adicional.adicional_id)
        if (!adicionalSnap) {
          throw new ApiError(404, 'Adicional no encontrado, no se puede crear contrato')
        }

        let precioAdicional = adicional.precio
        precioFinal += precioAdicional
      }
    }

    const nuevoContrato = {
      ...data,
      precio_final: precioFinal,
      abonado: 0,
      estado: 'activo',
      num_contrato: nuevoNumContrato,
      fecha_creacion: admin.firestore.FieldValue.serverTimestamp(),
      fecha_modificacion: admin.firestore.FieldValue.serverTimestamp()
    }

    const createdContrato = await this.repo.crearContrato(nuevoContrato)
    const contratoId = createdContrato.id
    
    const adicionales_contrato = {
      contrato_id: contratoId,
      adicionalesInfo: adicionalesInfo || [],
      activo: true,
      fecha_creacion: admin.firestore.FieldValue.serverTimestamp(),
      fecha_modificacion: admin.firestore.FieldValue.serverTimestamp()
    }
    await this.repo.asignarAdicionalesAContrato(adicionales_contrato)

    const beneficiarios_contrato = {
      contrato_id: contratoId,
      beneficiariosInfo: beneficiariosInfo || []
    }
    await this.repo.asignarBeneficiariosAContrato(beneficiarios_contrato)

    const direccionCobro_contrato = {
      contrato_id: contratoId,
      ...direccionCobroInfo
    }
    await this.repo.asignarDireccionCobroAContrato(direccionCobro_contrato)

    return createdContrato
  }
  

  async crearPaqueteAdicional(data) {
    const paquete_id = data.paquete_id ?? data.paquetes_id
    const adicional_id = data.adicional_id ?? data.adicionales_id

    if (!data.paquete && !data.adicional && !paquete_id && !adicional_id) {
      throw new ApiError(400, 'Datos de paquete y/o adicional son requeridos')
    }

    if(paquete_id && adicional_id) {
      const paqueteSnap = await this.repo.findPaqueteById(paquete_id)
      if (!paqueteSnap) {
        throw new ApiError(404, 'Paquete no encontrado, no se puede crear promo')
      }
      const adicionalSnap = await this.repo.findAdicionalById(adicional_id)
      if (!adicionalSnap) {
        throw new ApiError(404, 'Adicional no encontrado, no se puede crear promo')
      }
      if (data.promo && data.precio_especial) {
        if (await this.repo.findPromoByIds(paquete_id, adicional_id)) {
          throw new ApiError(409, 'La combinación de paquete y adicional ya existe')
        }
        const promoSnap = await this.repo.crearPromo({
          paquete_id,
          adicional_id,
          precio_especial: data.precio_especial ?? null,
          activo: data.activo ?? true,
          fecha_creacion: admin.firestore.FieldValue.serverTimestamp(),
          fecha_modificacion: admin.firestore.FieldValue.serverTimestamp()
        })
        return {
          ...promoSnap,
          paquete: { ...paqueteSnap },
          adicional: { ...adicionalSnap }
        }
      } else {
        throw new ApiError(400, 'Datos de la promoción son requeridos')
      }
    }

    if (data.hasOwnProperty('paquete') && data.hasOwnProperty('adicional')) {

      if (await this.repo.findPaqueteByName(data.paquete.nombre)) {
        throw new ApiError(409, 'Un paquete ya existe con ese nombre')
      }
      const infoPaquete = {
        ...data.paquete,
        activo: data.paquete.activo ?? true,
        fecha_creacion: admin.firestore.FieldValue.serverTimestamp(),
        fecha_modificacion: admin.firestore.FieldValue.serverTimestamp()
      }
      const paqueteSnap = await this.repo.crearNuevoPaquete(infoPaquete)
      const paqueteId = paqueteSnap.paquete_id

      if (await this.repo.findAdicionalByName(data.adicional.nombre)) {
        throw new ApiError(409, 'Un adicional ya existe con ese nombre')
      }
      const infoAdicional = {
        ...data.adicional,
        activo: data.adicional.activo ?? true,
        fecha_creacion: admin.firestore.FieldValue.serverTimestamp(),
        fecha_modificacion: admin.firestore.FieldValue.serverTimestamp()
      }
      const adicionalSnap = await this.repo.crearNuevoAdicional(infoAdicional)
      const adicionalId = adicionalSnap.adicional_id

      if (data.promo) {
        if (await this.repo.findPromoByIds(paqueteId, adicionalId)) {
          throw new ApiError(409, 'La combinación de paquete y adicional ya existe')
        }
        const promoSnap = await this.repo.crearPromo({
          paquete_id: paqueteId,
          adicional_id: adicionalId,
          precio_especial: data.precio_especial ?? null
        })

        return {
          ...promoSnap,
          paquete: { ...paqueteSnap },
          adicional: { ...adicionalSnap }
        }
      } else {
        return {
          paquete: { ...paqueteSnap },
          adicional: { ...adicionalSnap }
        }
      }
    }

    if (data.hasOwnProperty('adicional')) {
      if (await this.repo.findAdicionalByName(data.adicional.nombre)) {
        throw new ApiError(409, 'Un adicional ya existe con ese nombre')
      }

      const infoAdicional = {
        ...data.adicional,
        activo: data.adicional.activo ?? true,
        fecha_creacion: admin.firestore.FieldValue.serverTimestamp(),
        fecha_modificacion: admin.firestore.FieldValue.serverTimestamp()
      }

      return await this.repo.crearNuevoAdicional(infoAdicional)
    }

    if (data.hasOwnProperty('paquete')) {
      if (await this.repo.findPaqueteByName(data.paquete.nombre)) {
        throw new ApiError(409, 'Un paquete ya existe con ese nombre')
      }

      const infoPaquete = {
        ...data.paquete,
        activo: data.paquete.activo ?? true,
        fecha_creacion: admin.firestore.FieldValue.serverTimestamp(),
        fecha_modificacion: admin.firestore.FieldValue.serverTimestamp()
      }
      return await this.repo.crearNuevoPaquete(infoPaquete)
    }
  }

  async crearRutaCobro(data) {
    let detallesInfo = []
    if (data.detalles && data.detalles.length > 0) {
      for (const detalle of data.detalles) {
        const contrato = await this.repo.findContratoById(detalle.contratos_id)
        if (contrato) {
          detallesInfo.push(detalle)
        }
      }
    }
    delete data.detalles

    const rutaCobro = {
      ...data,
      estado: 'asignada',
      ciclo_actual: 1,
      proxima_fecha: this.calcularProximaFecha(data.fecha_inicio, data.periodicidad),
      activo: data.activo ?? true,
      fecha_creacion: admin.firestore.FieldValue.serverTimestamp(),
      fecha_modificacion: admin.firestore.FieldValue.serverTimestamp()
    }

    const createdRutaCobro = await this.repo.crearRutaCobro(rutaCobro)

    await this.repo.asignarDetallesRutaCobro(createdRutaCobro.ruta_cobros_id, detallesInfo)
    return createdRutaCobro
  }

  async nuevoPago(data) {
    const pago = {
      contratos_id: data.contratos_id,
      monto: data.monto,
      estatus: 'validado',
      fechaPago: admin.firestore.FieldValue.serverTimestamp(),
      fecha_creacion: admin.firestore.FieldValue.serverTimestamp(),
      fecha_modificacion: admin.firestore.FieldValue.serverTimestamp()
    }

    const nuevoPago = await this.repo.newPago(pago)
    return { nuevoPago }
  }

  async listarPagos() {
    return await this.repo.listarPagos()
  }

  async obtenerPago(id) {
    const pago = await this.repo.obtenerPago(id)
    if (!pago) {
      throw new ApiError(404, 'Pago no encontrado')
    }
    return pago
  }

  async validarPago(id, estatus, usuarioId) {
    return await this.repo.validarPago({
      pagoId: id,
      estatus,
      usuarioId
    })
  }

  async revisarVisitaRuta(rutaId, detalleId, payload, usuarioId) {
    return await this.repo.revisarVisitaRuta({
      rutaId,
      detalleId,
      estatusPago: payload.estatus_pago,
      usuarioId
    })
  }

  async terminarValidacionRuta(rutaId, usuarioId) {
    return await this.repo.terminarValidacionRuta({
      rutaId,
      usuarioId,
      calcularProximaFecha: this.calcularProximaFecha.bind(this)
    })
  }

  async obtenerHistorialCliente(clienteID) {
    console.log('Procesando historial del cliente:', clienteID)

    const listaPagos = await this.repo.getPagosByCliente(clienteID)

    const totalPagado = listaPagos.reduce((acumulado, pago) => acumulado + (pago.monto || 0), 0)

    return {
        clienteID,
        resumen: {
            cantidadPagos: listaPagos.length,
            montoTotalHistorico: totalPagado,
            ultimoPago: listaPagos[0] ? listaPagos[0].fechaPago : null
        },
        pagos: listaPagos
    }
  }

  async darBajaCliente(clienteId) {
    const cliente = await this.repo.findClienteById(clienteId)
    if (!cliente) {
      throw new ApiError(404, 'Cliente no encontrado')
    }
    if (!cliente.activo) {
      throw new ApiError(400, 'Cliente ya está dado de baja')
    }
    await this.repo.darBajaCliente(clienteId)
  }
}
