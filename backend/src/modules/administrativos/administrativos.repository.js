/*
  * Módulo de administrativos - Repositorio
*/
import { admin, db } from '../../config/firebase.js'
import { ApiError } from '../../shared/utils/apiError.js'

export class AdministrativosRepository {


  async findUserByEmail(email) {
    const usua = await db.collection("usuarios").where('email', '==', email).limit(1).get()
    if (usua.empty) return null
    return { usuarios_id: usua.docs[0].id, ...usua.docs[0].data() }
  }

  async findUserById(id) {
    const userDoc = await db.collection("usuarios").doc(id).get()
    if (!userDoc.exists) return null
    return { usuarios_id: userDoc.id, ...userDoc.data() }
  }
  
  async findClienteById(id) {
    const clienteDoc = await db.collection("clientes").doc(id).get()
    if (!clienteDoc.exists) return null
    return { clientes_id: clienteDoc.id, ...clienteDoc.data() }
  }

  async findCobradorById(id) {
    const cobradorDoc = await db.collection("cobradores").doc(id).get()
    if (!cobradorDoc.exists) return null
    return { cobradores_id: cobradorDoc.id, ...cobradorDoc.data() }
  }

  async findPaqueteById(id) {
    const paqueteDoc = await db.collection("paquetes").doc(id).get()
    if (!paqueteDoc.exists) return null
    return { paquetes_id: paqueteDoc.id, ...paqueteDoc.data() }
  }

  async findAdicionalById(id) {
    const adicionalDoc = await db.collection("adicionales").doc(id).get()
    if (!adicionalDoc.exists) return null
    return { adicionales_id: adicionalDoc.id, ...adicionalDoc.data() }
  }

  async findPaqueteByName(nombre) {
    const paquete = await db.collection("paquetes").where('nombre', '==', nombre).limit(1).get()
    if (paquete.empty) return null
    return { paquetes_id: paquete.docs[0].id, ...paquete.docs[0].data() }
  }

  async findAdicionalByName(nombre) {
    const adicional = await db.collection("adicionales").where('nombre', '==', nombre).limit(1).get()
    if (adicional.empty) return null
    return { adicionales_id: adicional.docs[0].id, ...adicional.docs[0].data() }
  }

  async findPromoByIds(paquete_id, adicional_id) {
    const promo = await db.collection("paquete_adicionales")
      .where('paquete_id', '==', paquete_id)
      .where('adicional_id', '==', adicional_id)
      .limit(1)
      .get()
    if (promo.empty) return null
    return { paquete_adicionales_id: promo.docs[0].id, ...promo.docs[0].data() }
  }

  async findContratoById(id) {
    const contratoDoc = await db.collection("contratos").doc(id).get()
    if (!contratoDoc.exists) return null
    return { contratos_id: contratoDoc.id, ...contratoDoc.data() }
  }

  async findRutaCobroById(id) {
    const rutaCobroDoc = await db.collection("ruta_cobros").doc(id).get()
    if (!rutaCobroDoc.exists) return null
    return { ruta_cobros_id: rutaCobroDoc.id, ...rutaCobroDoc.data() }
  }

  async obtenerDetallesCobro(rutaCobroId) {
    const detallesSnapshot = await db.collection("detalle_ruta_cobros")
      .where('ruta_cobros_id', '==', rutaCobroId)
      .get()

    // 1. Convertimos los docs del snapshot en un array de promesas
    const promesasDetalles = detallesSnapshot.docs.map(async (detalleDoc) => {
      const detalle = detalleDoc.data();

      const contratoInfo = await this.findContratoById(detalle.contratos_id);
      const clienteInfo = await this.clienteInfoById(contratoInfo.clientes_id);
      
      const direccionCobroDoc = await db.collection("direcciones_cobro").doc(detalle.direccion_cobro_id).get();
      const direccionCobroInfo = direccionCobroDoc.data();

      if (direccionCobroInfo) {
        delete direccionCobroInfo.contrato_id;
      }

      return {
        ...clienteInfo,
        direccionCobro: { ...direccionCobroInfo }
      };
    });

    const detalles = await Promise.all(promesasDetalles);
    return detalles;
  }

  async obtenerInfoContratos(){
    const contratosSnap = await db.collection('contratos').get()
    if ( contratosSnap.empty ) {
      return []
    }
    const clientesInfo = []

    const promesasContratos = contratosSnap.docs.map(async (contratoDoc) => {
      const contrato = contratoDoc.data();

      const paqueteInfo = await this.findPaqueteById(contrato.paquetes_id);
      const clienteInfo = await this.clienteInfoById(contrato.clientes_id);
      const direccionCobroSnap = await db.collection("direcciones_cobro")
        .where('contrato_id', '==', contratoDoc.id)
        .limit(1)
        .get()
      const direccionCobroInfo = direccionCobroSnap.empty
        ? null
        : { direcciones_cobro_id: direccionCobroSnap.docs[0].id, ...direccionCobroSnap.docs[0].data() }

      delete contrato.clientes_id
      delete contrato.paquetes_id
      delete contrato.creado_por
      delete contrato.fecha_creacion
      delete contrato.fecha_actualizacion
      delete contrato.actualizado_por

      return {
        contratos_id: contratoDoc.id,
        ...contrato,
        cliente: { ...clienteInfo },
        paquete: { ...paqueteInfo },
        direccion_cobro: direccionCobroInfo
      };
    });

    const contratos = await Promise.all(promesasContratos)
    return contratos
  }

  async listarSolicitudesBeneficiarios() {
    const solicitudesSnap = await db.collection('solicitudes_beneficiarios').get()
    if (solicitudesSnap.empty) return []

    const solicitudes = await Promise.all(solicitudesSnap.docs.map(async doc => {
      const solicitud = { solicitud_beneficiario_id: doc.id, ...doc.data() }
      const clienteInfo = solicitud.cliente_id ? await this.clienteInfoById(solicitud.cliente_id) : null
      const contrato = solicitud.contratos_id ? await this.findContratoById(solicitud.contratos_id) : null

      return {
        ...solicitud,
        cliente: clienteInfo,
        contrato: contrato
          ? {
              contratos_id: contrato.contratos_id,
              num_contrato: contrato.num_contrato ?? solicitud.num_contrato ?? null,
              estado: contrato.estado ?? null
            }
          : null
      }
    }))

    return solicitudes.sort((a, b) => this.fechaMillis(b.fecha_creacion) - this.fechaMillis(a.fecha_creacion))
  }

  async resumenSolicitudesBeneficiarios() {
    const pendientesSnap = await db.collection('solicitudes_beneficiarios')
      .where('estado', '==', 'pendiente')
      .get()

    const porTipo = {
      crear: 0,
      actualizar: 0,
      eliminar: 0
    }

    pendientesSnap.docs.forEach(doc => {
      const tipo = doc.data().tipo
      if (porTipo[tipo] !== undefined) porTipo[tipo]++
    })

    return {
      pendientes: pendientesSnap.size,
      por_tipo: porTipo
    }
  }

  async resolverSolicitudBeneficiario({ solicitudId, accion, comentarioAdmin, usuarioId }) {
    const solicitudRef = db.collection('solicitudes_beneficiarios').doc(solicitudId)
    let beneficiarioCreadoId = null

    await db.runTransaction(async transaction => {
      const solicitudDoc = await transaction.get(solicitudRef)
      if (!solicitudDoc.exists) {
        throw new ApiError(404, 'Solicitud no encontrada')
      }

      const solicitud = { solicitud_beneficiario_id: solicitudDoc.id, ...solicitudDoc.data() }
      if (solicitud.estado !== 'pendiente') {
        throw new ApiError(409, 'La solicitud ya fue revisada')
      }

      const updateSolicitud = {
        estado: accion === 'aprobar' ? 'aprobada' : 'rechazada',
        comentario_admin: comentarioAdmin,
        revisado_por: usuarioId,
        fecha_revision: admin.firestore.FieldValue.serverTimestamp(),
        fecha_modificacion: admin.firestore.FieldValue.serverTimestamp()
      }

      if (accion === 'aprobar') {
        if (solicitud.tipo === 'crear') {
          const beneficiarioRef = db.collection('beneficiarios').doc()
          beneficiarioCreadoId = beneficiarioRef.id
          transaction.set(beneficiarioRef, {
            ...solicitud.datos_propuestos,
            contrato_id: solicitud.contratos_id,
            activo: true,
            creado_por: usuarioId,
            fecha_creacion: admin.firestore.FieldValue.serverTimestamp(),
            fecha_modificacion: admin.firestore.FieldValue.serverTimestamp()
          })
          updateSolicitud.beneficiario_creado_id = beneficiarioRef.id
        } else {
          const beneficiarioRef = db.collection('beneficiarios').doc(solicitud.beneficiario_id)
          const beneficiarioDoc = await transaction.get(beneficiarioRef)
          if (!beneficiarioDoc.exists) {
            throw new ApiError(404, 'Beneficiario no encontrado')
          }

          const beneficiario = beneficiarioDoc.data()
          const contratoIdBeneficiario = beneficiario.contrato_id ?? beneficiario.contratos_id
          if (contratoIdBeneficiario !== solicitud.contratos_id) {
            throw new ApiError(409, 'El beneficiario no pertenece al contrato de la solicitud')
          }

          if (solicitud.tipo === 'actualizar') {
            transaction.update(beneficiarioRef, {
              ...solicitud.datos_propuestos,
              actualizado_por: usuarioId,
              fecha_modificacion: admin.firestore.FieldValue.serverTimestamp()
            })
          } else if (solicitud.tipo === 'eliminar') {
            transaction.update(beneficiarioRef, {
              activo: false,
              actualizado_por: usuarioId,
              fecha_modificacion: admin.firestore.FieldValue.serverTimestamp()
            })
          } else {
            throw new ApiError(400, 'Tipo de solicitud no soportado')
          }
        }
      }

      transaction.update(solicitudRef, updateSolicitud)
    })

    return {
      solicitud: {
        solicitud_beneficiario_id: solicitudId,
        estado: accion === 'aprobar' ? 'aprobada' : 'rechazada',
        beneficiario_creado_id: beneficiarioCreadoId
      },
      solicitudes: await this.listarSolicitudesBeneficiarios()
    }
  }

  async clienteInfoById(id) {
    const clienteDoc = await db.collection("clientes").doc(id).get()
    if (!clienteDoc.exists) return null
    const userDoc = await db.collection("usuarios").doc(clienteDoc.data().usuarios_id).get()
    if (!userDoc.exists) return null
    
    const userData = userDoc.data()
    const clienteData = clienteDoc.data()
    const clienteInfo = {
      cliente: {
        clientes_id: clienteDoc.id,
        calle: clienteData.calle,
        colonia: clienteData.colonia,
        num_casa: clienteData.num_casa,
        telefono: clienteData.telefono
      },
      usuario: {
        usuarios_id: userDoc.id,
        nombre: userData.nombre,
        apaterno: userData.apaterno,
        amaterno: userData.amaterno,
        email: userData.email
      }
    }
    return clienteInfo
  }

  async listarClientesActivos() {

    // 1. Clientes activos
    const clientesSnapshot = await db.collection('clientes')
      .where('activo', '==', true)
      .get();

    if (clientesSnapshot.empty) {
      return [];
    }

    const clientesData = [];
    const usuariosIds = [];

    clientesSnapshot.forEach(doc => {
      const cliente = { cliente_id: doc.id, ...doc.data() };
      clientesData.push(cliente);
      if (cliente.usuarios_id) {
        usuariosIds.push(cliente.usuarios_id);
      }
    });

    // 2. IDs únicos de usuario
    const uniqueUserIds = [...new Set(usuariosIds)];
    const userRefs = uniqueUserIds.map(id => db.collection('usuarios').doc(id));

    // 3. Leer todos los usuarios (documentos completos)
    let usuariosMap = new Map();
    if (userRefs.length > 0) {
      const userSnapshots = await db.getAll(...userRefs);
      userSnapshots.forEach(userDoc => {
        if (userDoc.exists) {
          const data = userDoc.data();
          // Solo extraemos los campos que nos interesan
          usuariosMap.set(userDoc.id, {
            nombre: data.nombre,
            apaterno: data.apaterno,
            amaterno: data.amaterno,
            email: data.email
          });
        }
      });
    }

    // 4. Combinar cliente + usuario filtrado
    const resultado = clientesData.map(cliente => ({
      cliente,
      usuario: cliente.usuarios_id
        ? (usuariosMap.get(cliente.usuarios_id) || null)
        : null,
    }));

    return resultado;
  }

  async listarCobradoresActivos() {

    // 1. Cobradores activos
    const cobradoresSnapshot = await db.collection('cobradores')
      .where('activo', '==', true)
      .get();

    if (cobradoresSnapshot.empty) {
      return [];
    }

    const cobradoresData = [];
    const usuariosIds = [];

    cobradoresSnapshot.forEach(doc => {
      const cobrador = { cobrador_id: doc.id, ...doc.data() };
      cobradoresData.push(cobrador);
      if (cobrador.usuarios_id) {
        usuariosIds.push(cobrador.usuarios_id);
      }
    });

    // 2. IDs únicos de usuario
    const uniqueUserIds = [...new Set(usuariosIds)];
    const userRefs = uniqueUserIds.map(id => db.collection('usuarios').doc(id));

    // 3. Leer todos los usuarios (documentos completos)
    let usuariosMap = new Map();
    if (userRefs.length > 0) {
      const userSnapshots = await db.getAll(...userRefs);
      userSnapshots.forEach(userDoc => {
        if (userDoc.exists) {
          const data = userDoc.data();
          // Solo extraemos los campos que nos interesan
          usuariosMap.set(userDoc.id, {
            nombre: data.nombre,
            apaterno: data.apaterno,
            amaterno: data.amaterno,
            email: data.email
          });
        }
      });
    }

    // 4. Combinar cobrador + usuario filtrado
    const resultado = cobradoresData.map(cobrador => ({
      cobrador,
      usuario: cobrador.usuarios_id
        ? (usuariosMap.get(cobrador.usuarios_id) || null)
        : null,
    }));

    return resultado;
  }

  async obtenerClienteEdicion(id) {
    const cliente = await this.findClienteById(id)
    if (!cliente) return null

    const usuario = cliente.usuarios_id
      ? await this.findUserById(cliente.usuarios_id)
      : null

    return {
      clienteID: id,
      cliente_id: id,
      nombre: usuario?.nombre ?? '',
      apaterno: usuario?.apaterno ?? '',
      amaterno: usuario?.amaterno ?? '',
      email: usuario?.email ?? '',
      telefono: cliente.telefono ?? '',
      calle: cliente.calle ?? '',
      colonia: cliente.colonia ?? '',
      numCasa: cliente.numCasa ?? cliente.num_casa ?? '',
      usuarioID: cliente.usuarios_id ?? null,
      usuario_id: cliente.usuarios_id ?? null,
      activo: cliente.activo !== false
    }
  }

  async actualizarCliente(id, data) {
    const update = {
      fecha_modificacion: admin.firestore.FieldValue.serverTimestamp()
    }

    if (data.telefono !== undefined) update.telefono = data.telefono
    if (data.calle !== undefined) update.calle = data.calle
    if (data.colonia !== undefined) update.colonia = data.colonia
    if (data.numCasa !== undefined) update.num_casa = data.numCasa

    await db.collection("clientes").doc(id).update(update)
    return await this.obtenerClienteEdicion(id)
  }

  async obtenerCobradorEdicion(id) {
    const cobrador = await this.findCobradorById(id)
    if (!cobrador) return null

    const usuario = cobrador.usuarios_id
      ? await this.findUserById(cobrador.usuarios_id)
      : null

    return {
      cobradorID: id,
      cobrador_id: id,
      nombre: usuario?.nombre ?? '',
      direccion: cobrador.direccion ?? '',
      telefono: cobrador.telefono ?? '',
      email: usuario?.email ?? '',
      usuarioID: cobrador.usuarios_id ?? null,
      usuario_id: cobrador.usuarios_id ?? null,
      activo: cobrador.activo !== false
    }
  }

  async actualizarCobrador(id, data) {
    const cobrador = await this.findCobradorById(id)
    const updateCobrador = {
      fecha_modificacion: admin.firestore.FieldValue.serverTimestamp()
    }

    if (data.direccion !== undefined) updateCobrador.direccion = data.direccion
    if (data.telefono !== undefined) updateCobrador.telefono = data.telefono

    await db.collection("cobradores").doc(id).update(updateCobrador)

    if (data.nombre !== undefined && cobrador?.usuarios_id) {
      await db.collection("usuarios").doc(cobrador.usuarios_id).update({
        nombre: data.nombre,
        fecha_modificacion: admin.firestore.FieldValue.serverTimestamp()
      })
    }

    return await this.obtenerCobradorEdicion(id)
  }

  async listarProductosActivos() {
    const promos = await db.collection('paquete_adicionales').where('activo', '==', true).get()
    const paquetes = await db.collection('paquetes').where('activo', '==', true).get()
    const adicionales = await db.collection('adicionales').where('activo', '==', true).get()

    const resultado = {
      paquetes: paquetes.docs.map(doc => ({ paquete_id: doc.id, ...doc.data() })),
      adicionales: adicionales.docs.map(doc => ({ adicional_id: doc.id, ...doc.data() })),
      promociones: promos.docs.map(doc => ({ promo_id: doc.id, ...doc.data() }))
    }
    return resultado
  }

  async listarRutasCobro() {
    // 1. Rutas de cobro activas
    const rutasSnapshot = await db.collection('ruta_cobros')
      .where('activo', '==', true)
      .get();
    return rutasSnapshot.docs.map(doc => ({ ruta_cobros_id: doc.id, ...doc.data() }));
  }

  async findClienteByEmail(email) {
    const cliente = await db.collection("clientes").where('email', '==', email).limit(1).get()
    if (cliente.empty) return null
    return { id: cliente.docs[0].id, ...cliente.docs[0].data() }
  }

  async crearUsuario(data) {
    const usuario = await db.collection("usuarios").doc()
    await usuario.set(data)
    return { usuario_id: usuario.id, ...data }
  }

  async crearCliente(data) {
     const cliente = await db.collection("clientes").doc()
     await cliente.set(data)
     return { cliente_id: cliente.id, ...data }
  }

  async crearCobrador(data) {
    const cobrador = await db.collection("cobradores").doc()
    await cobrador.set(data)
    return { cobrador_id: cobrador.id, ...data }
  }

  async crearPromo(data) {
    const promo = await db.collection("paquete_adicionales").doc()
    await promo.set(data)
    return { promo_id: promo.id, ...data }
  }

  async crearNuevoPaquete(data) {
    const paquete = await db.collection("paquetes").doc()
    await paquete.set(data)
    return { paquete_id: paquete.id, ...data }
  }

  async crearNuevoAdicional(data) {
    const adicional = await db.collection("adicionales").doc()
    await adicional.set(data)
    return { adicional_id: adicional.id, ...data }
  }
  
  async darBajaCliente(clienteId) {
    try {
      const clienteRef = db.collection("clientes").doc(clienteId);
      await clienteRef.update({
        activo: false,
        fecha_modificacion: admin.firestore.FieldValue.serverTimestamp()
      });

      const clienteDoc = await clienteRef.get();
      const usuarioId = clienteDoc.data().usuarios_id;
      const usuarioRef = db.collection("usuarios").doc(usuarioId);
      await usuarioRef.update({
        activo: false,
        fecha_modificacion: admin.firestore.FieldValue.serverTimestamp()
      });
    } catch (error) {
    console.error('Error al dar de baja cliente:', error);
    throw error; // o retorna un error controlado según tu lógica
  }
  }

  async crearContrato(data) {
    const contrato = await db.collection("contratos").doc()
    await contrato.set(data)
    return { id: contrato.id, ...data }
  }

  async asignarAdicionalesAContrato(adicionales_contrato) {
    adicionales_contrato.adicionalesInfo.forEach(async adicional => {
      const contratoAdicional = await db.collection("contrato_adicionales").doc()
      await contratoAdicional.set({
        contrato_id: adicionales_contrato.contrato_id,
        adicional_id: adicional.adicional_id,
        precio_unitario: adicional.precio,
        activo: adicionales_contrato.activo ?? true,
        fecha_creacion: adicionales_contrato.fecha_creacion,
        fecha_modificacion: adicionales_contrato.fecha_modificacion
      })
    })
  }

  async asignarBeneficiariosAContrato(beneficiarios_contrato) {
    beneficiarios_contrato.beneficiariosInfo.forEach(async beneficiario => {
      const contratoBeneficiario = await db.collection("beneficiarios").doc()
      await contratoBeneficiario.set({
        nombre: beneficiario.nombre,
        apaterno: beneficiario.apaterno,
        amaterno: beneficiario.amaterno,
        parentesco: beneficiario.parentesco,
        telefono: beneficiario.telefono,
        direccion: beneficiario.direccion,
        contrato_id: beneficiarios_contrato.contrato_id
      })
    })
  }

  async asignarDireccionCobroAContrato(direccion_cobro_contrato) {
    const contratoDireccionCobro = await db.collection("direcciones_cobro").doc()
    await contratoDireccionCobro.set(direccion_cobro_contrato)
  }

  async asignarDetallesRutaCobro(rutaCobroId, detallesInfo) {
    detallesInfo.forEach(async detalle => {
      const detalleDoc = await db.collection("detalle_ruta_cobros").doc()
      await detalleDoc.set({
        ...detalle,
        ruta_cobros_id: rutaCobroId
      })
    })
  }

  async crearRutaCobro(data) {
    const rutaCobro = await db.collection("ruta_cobros").doc()
    await rutaCobro.set(data)
    return { ruta_cobros_id: rutaCobro.id, ...data }
  }

  async newPago(data) {
    const pagoRef = db.collection("pagos").doc()
    const contratoRef = db.collection("contratos").doc(data.contratos_id)

    return await db.runTransaction(async transaction => {
      const contratoDoc = await transaction.get(contratoRef)
      if (!contratoDoc.exists) {
        throw new ApiError(404, 'Contrato no encontrado')
      }

      const contrato = contratoDoc.data()
      const abonadoActual = Number(contrato.abonado ?? 0)
      const monto = Number(data.monto)

      if (!Number.isFinite(abonadoActual)) {
        throw new ApiError(409, 'El monto abonado actual del contrato no es valido')
      }
      if (!Number.isFinite(monto) || monto <= 0) {
        throw new ApiError(400, 'El monto del pago debe ser mayor a cero')
      }

      const nuevoAbonado = abonadoActual + monto
      const precioFinal = Number(contrato.precio_final ?? 0)

      if (Number.isFinite(precioFinal) && precioFinal > 0 && nuevoAbonado > precioFinal) {
        throw new ApiError(400, 'El monto del pago excede el saldo pendiente del contrato')
      }

      const pago = {
        ...data,
        monto
      }

      transaction.set(pagoRef, pago)
      transaction.update(contratoRef, {
        abonado: nuevoAbonado,
        fecha_modificacion: admin.firestore.FieldValue.serverTimestamp()
      })

      return {
        pagos_id: pagoRef.id,
        ...pago,
        contrato: {
          contratos_id: contratoDoc.id,
          abonado: nuevoAbonado
        }
      }
    })
  }

  async listarPagos() {
    const pagosSnap = await db.collection("pagos").get()
    if (pagosSnap.empty) return []

    const pagos = await Promise.all(pagosSnap.docs.map(async doc => {
      const pago = { pagos_id: doc.id, id: doc.id, ...doc.data() }
      return await this.enriquecerPago(pago)
    }))

    return pagos.sort((a, b) => this.fechaMillis(b.fechaPago ?? b.fecha_pago) - this.fechaMillis(a.fechaPago ?? a.fecha_pago))
  }

  async obtenerPago(id) {
    const pagoDoc = await db.collection("pagos").doc(id).get()
    if (!pagoDoc.exists) return null
    return await this.enriquecerPago({ pagos_id: pagoDoc.id, id: pagoDoc.id, ...pagoDoc.data() })
  }

  async enriquecerPago(pago) {
    const contratoId = pago.contratos_id ?? pago.contrato_id
    const contrato = contratoId ? await this.findContratoById(contratoId) : null
    const clienteInfo = contrato?.clientes_id ? await this.clienteInfoById(contrato.clientes_id) : null
    const cobradorInfo = pago.cobradores_id ? await this.cobradorInfoById(pago.cobradores_id) : null

    return {
      ...pago,
      pagoID: pago.pagos_id,
      contrato_id: contratoId,
      contratoID: contratoId,
      num_contrato: contrato?.num_contrato ?? null,
      cliente: clienteInfo ? this.nombreCompleto(clienteInfo.usuario) : null,
      cobrador: cobradorInfo ? this.nombreCompleto(cobradorInfo.usuario) : null
    }
  }

  async cobradorInfoById(id) {
    const cobradorDoc = await db.collection("cobradores").doc(id).get()
    if (!cobradorDoc.exists) return null

    const cobrador = { cobradores_id: cobradorDoc.id, ...cobradorDoc.data() }
    const usuarioDoc = cobrador.usuarios_id
      ? await db.collection("usuarios").doc(cobrador.usuarios_id).get()
      : null

    return {
      cobrador,
      usuario: usuarioDoc?.exists
        ? { usuarios_id: usuarioDoc.id, ...usuarioDoc.data() }
        : null
    }
  }

  nombreCompleto(usuario) {
    if (!usuario) return ''
    return [usuario.nombre, usuario.apaterno, usuario.amaterno].filter(Boolean).join(' ')
  }

  fechaMillis(fecha) {
    if (!fecha) return 0
    if (fecha.toDate) return fecha.toDate().getTime()
    if (fecha.seconds || fecha._seconds) return new Date((fecha.seconds ?? fecha._seconds) * 1000).getTime()
    const parsed = new Date(fecha)
    return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime()
  }

  async validarPago({ pagoId, estatus, usuarioId }) {
    const pagoRef = db.collection("pagos").doc(pagoId)

    await db.runTransaction(async transaction => {
      const pagoDoc = await transaction.get(pagoRef)
      if (!pagoDoc.exists) {
        throw new ApiError(404, 'Pago no encontrado')
      }

      const pago = { pagos_id: pagoDoc.id, ...pagoDoc.data() }
      const estatusActual = pago.estatus ?? pago.estado
      if (estatusActual !== 'por validar') {
        throw new ApiError(409, 'Este pago ya fue validado o cancelado')
      }

      const contratoId = pago.contratos_id ?? pago.contrato_id
      const contratoRef = contratoId ? db.collection("contratos").doc(contratoId) : null
      const contratoDoc = contratoRef ? await transaction.get(contratoRef) : null

      if (estatus === 'validado' && (!contratoDoc || !contratoDoc.exists)) {
        throw new ApiError(404, 'Contrato del pago no encontrado')
      }

      const updatePago = {
        estatus,
        fecha_validacion: admin.firestore.FieldValue.serverTimestamp(),
        fecha_modificacion: admin.firestore.FieldValue.serverTimestamp(),
        validado_por: usuarioId,
        actualizado_por: usuarioId
      }

      transaction.update(pagoRef, updatePago)

      if (estatus === 'validado') {
        const contrato = contratoDoc.data()
        const abonadoActual = Number(contrato.abonado ?? 0)
        const monto = Number(pago.monto ?? 0)
        const nuevoAbonado = abonadoActual + monto
        const precioFinal = Number(contrato.precio_final ?? 0)

        if (Number.isFinite(precioFinal) && precioFinal > 0 && nuevoAbonado > precioFinal) {
          throw new ApiError(400, 'El monto del pago excede el saldo pendiente del contrato')
        }

        const updateContrato = {
          abonado: nuevoAbonado,
          fecha_modificacion: admin.firestore.FieldValue.serverTimestamp()
        }

        if (Number.isFinite(precioFinal) && precioFinal > 0 && nuevoAbonado >= precioFinal) {
          updateContrato.estado = 'pagado'
        }

        transaction.update(contratoRef, updateContrato)
      }

      return {
        ...pago,
        ...updatePago,
        estatus
      }
    })

    return {
      pago: await this.obtenerPago(pagoId),
      rutaRenovada: null
    }
  }

  async listarRutasCobroValidacion() {
    const rutasSnapshot = await db.collection('ruta_cobros')
      .where('activo', '==', true)
      .get()

    const rutas = await Promise.all(rutasSnapshot.docs.map(async doc => {
      const ruta = { ruta_cobros_id: doc.id, ...doc.data() }
      const cobradorInfo = ruta.cobradores_id ? await this.cobradorInfoById(ruta.cobradores_id) : null
      const resumen = await this.resumenValidacionRuta(ruta)

      return {
        ...ruta,
        cobrador: cobradorInfo ? this.nombreCompleto(cobradorInfo.usuario) : null,
        resumen
      }
    }))

    return rutas.sort((a, b) => this.fechaMillis(b.fecha_inicio) - this.fechaMillis(a.fecha_inicio))
  }

  async obtenerRutaCobroValidacion(rutaId) {
    const rutaDoc = await db.collection('ruta_cobros').doc(rutaId).get()
    if (!rutaDoc.exists) return null

    const ruta = { ruta_cobros_id: rutaDoc.id, ...rutaDoc.data() }
    const detallesSnapshot = await db.collection('detalle_ruta_cobros')
      .where('ruta_cobros_id', '==', rutaId)
      .get()
    const detalles = await Promise.all(detallesSnapshot.docs.map(doc => this.detalleValidacionCompleto(doc, ruta)))
    detalles.sort((a, b) => Number(a.detalle.orden_visita ?? 0) - Number(b.detalle.orden_visita ?? 0))

    const cobradorInfo = ruta.cobradores_id ? await this.cobradorInfoById(ruta.cobradores_id) : null

    return {
      ...ruta,
      cobrador: cobradorInfo ? this.nombreCompleto(cobradorInfo.usuario) : null,
      resumen: this.calcularResumenValidacion(detalles.map(item => item.detalle), this.cicloActual(ruta)),
      detalles
    }
  }

  async revisarVisitaRuta({ rutaId, detalleId, estatusPago, usuarioId }) {
    const rutaRef = db.collection('ruta_cobros').doc(rutaId)
    const detalleRef = db.collection('detalle_ruta_cobros').doc(detalleId)

    await db.runTransaction(async transaction => {
      const rutaDoc = await transaction.get(rutaRef)
      if (!rutaDoc.exists) throw new ApiError(404, 'Ruta de cobro no encontrada')

      const ruta = { ruta_cobros_id: rutaDoc.id, ...rutaDoc.data() }
      const cicloActual = this.cicloActual(ruta)

      const detalleDoc = await transaction.get(detalleRef)
      if (!detalleDoc.exists) throw new ApiError(404, 'Visita no encontrada')

      const detalle = { detalle_ruta_cobros_id: detalleDoc.id, ...detalleDoc.data() }
      if (detalle.ruta_cobros_id !== rutaId) {
        throw new ApiError(404, 'La visita no pertenece a la ruta indicada')
      }
      if (!this.detalleVisitadoEnCiclo(detalle, cicloActual)) {
        throw new ApiError(409, 'La visita aun no tiene resultado capturado para este ciclo')
      }

      const pagoSnap = await transaction.get(
        db.collection('pagos')
          .where('ruta_cobros_id', '==', rutaId)
          .where('detalle_ruta_cobros_id', '==', detalleId)
          .where('ciclo_ruta', '==', cicloActual)
          .limit(1)
      )
      const pagoDoc = pagoSnap.empty ? null : pagoSnap.docs[0]
      const pago = pagoDoc ? { pagos_id: pagoDoc.id, ...pagoDoc.data() } : null
      const estatusActual = pago?.estatus ?? pago?.estado

      if (detalle.resultado === 'pagado') {
        if (!pago) throw new ApiError(404, 'Pago de la visita no encontrado')
        if (estatusActual === 'por validar' && !estatusPago) {
          throw new ApiError(400, 'Indica si el pago se valida o se cancela')
        }
      }

      if (pago && estatusActual === 'por validar' && estatusPago) {
        const pagoRef = db.collection('pagos').doc(pago.pagos_id)
        let contratoRef = null
        let updateContrato = null
        if (estatusPago === 'validado') {
          const contratoId = pago.contratos_id ?? pago.contrato_id
          contratoRef = db.collection('contratos').doc(contratoId)
          const contratoDoc = await transaction.get(contratoRef)
          if (!contratoDoc.exists) throw new ApiError(404, 'Contrato del pago no encontrado')

          const contrato = contratoDoc.data()
          const abonadoActual = Number(contrato.abonado ?? 0)
          const monto = Number(pago.monto ?? 0)
          const nuevoAbonado = abonadoActual + monto
          const precioFinal = Number(contrato.precio_final ?? 0)

          if (Number.isFinite(precioFinal) && precioFinal > 0 && nuevoAbonado > precioFinal) {
            throw new ApiError(400, 'El monto del pago excede el saldo pendiente del contrato')
          }

          updateContrato = {
            abonado: nuevoAbonado,
            fecha_modificacion: admin.firestore.FieldValue.serverTimestamp()
          }
          if (Number.isFinite(precioFinal) && precioFinal > 0 && nuevoAbonado >= precioFinal) {
            updateContrato.estado = 'pagado'
          }
        }

        transaction.update(pagoRef, {
          estatus: estatusPago,
          fecha_validacion: admin.firestore.FieldValue.serverTimestamp(),
          fecha_modificacion: admin.firestore.FieldValue.serverTimestamp(),
          validado_por: usuarioId,
          actualizado_por: usuarioId
        })

        if (contratoRef && updateContrato) {
          transaction.update(contratoRef, updateContrato)
        }
      }

      transaction.update(detalleRef, {
        revisado: true,
        revision_ciclo: cicloActual,
        estatus_pago_revision: estatusPago ?? estatusActual ?? null,
        fecha_revision: admin.firestore.FieldValue.serverTimestamp(),
        revisado_por: usuarioId,
        fecha_modificacion: admin.firestore.FieldValue.serverTimestamp(),
        actualizado_por: usuarioId
      })
    })

    return {
      ruta: await this.obtenerRutaCobroValidacion(rutaId)
    }
  }

  async terminarValidacionRuta({ rutaId, usuarioId, calcularProximaFecha }) {
    const rutaRef = db.collection('ruta_cobros').doc(rutaId)
    let rutaRenovada = null

    await db.runTransaction(async transaction => {
      const rutaDoc = await transaction.get(rutaRef)
      if (!rutaDoc.exists) throw new ApiError(404, 'Ruta de cobro no encontrada')

      const ruta = { ruta_cobros_id: rutaDoc.id, ...rutaDoc.data() }
      const cicloActual = this.cicloActual(ruta)
      if (ruta.estado !== 'completada') {
        throw new ApiError(409, 'Solo se pueden terminar rutas completadas')
      }

      const detallesSnap = await transaction.get(
        db.collection('detalle_ruta_cobros').where('ruta_cobros_id', '==', rutaId)
      )

      if (detallesSnap.empty) {
        throw new ApiError(409, 'La ruta no tiene visitas asignadas')
      }

      const pendientes = detallesSnap.docs.filter(doc => {
        const detalle = doc.data()
        return !this.detalleVisitadoEnCiclo(detalle, cicloActual) || !this.detalleRevisadoEnCiclo(detalle, cicloActual)
      })

      if (pendientes.length > 0) {
        throw new ApiError(409, 'Aun hay visitas pendientes de revisar')
      }

      const nuevaFechaInicio = ruta.proxima_fecha ?? calcularProximaFecha(ruta.fecha_inicio, ruta.periodicidad)
      const nuevaProximaFecha = calcularProximaFecha(nuevaFechaInicio, ruta.periodicidad)
      const siguienteCiclo = cicloActual + 1
      const fechaCierre = new Date().toISOString()

      detallesSnap.docs.forEach(detalleDoc => {
        const detalle = detalleDoc.data()
        transaction.update(detalleDoc.ref, {
          historial_ciclos: admin.firestore.FieldValue.arrayUnion({
            ciclo: cicloActual,
            resultado: detalle.resultado ?? null,
            monto_recibido: Number(detalle.monto_recibido ?? 0),
            fecha_realizacion: this.serializarFecha(detalle.fecha_realizacion),
            revisado: true,
            estatus_pago_revision: detalle.estatus_pago_revision ?? null,
            fecha_revision: this.serializarFecha(detalle.fecha_revision),
            fecha_cierre: fechaCierre
          }),
          fecha_modificacion: admin.firestore.FieldValue.serverTimestamp(),
          actualizado_por: usuarioId
        })
      })

      transaction.update(rutaRef, {
        estado: 'asignada',
        ciclo_actual: siguienteCiclo,
        fecha_inicio: nuevaFechaInicio,
        proxima_fecha: nuevaProximaFecha,
        fecha_ultima_renovacion: admin.firestore.FieldValue.serverTimestamp(),
        fecha_modificacion: admin.firestore.FieldValue.serverTimestamp(),
        actualizado_por: usuarioId
      })

      rutaRenovada = {
        ruta_cobros_id: rutaId,
        ciclo_actual: siguienteCiclo,
        fecha_inicio: nuevaFechaInicio,
        proxima_fecha: nuevaProximaFecha
      }
    })

    return {
      rutaRenovada,
      rutas: await this.listarRutasCobroValidacion()
    }
  }

  async resumenValidacionRuta(ruta) {
    const detallesSnap = await db.collection('detalle_ruta_cobros')
      .where('ruta_cobros_id', '==', ruta.ruta_cobros_id)
      .get()
    return this.calcularResumenValidacion(detallesSnap.docs.map(doc => doc.data()), this.cicloActual(ruta))
  }

  calcularResumenValidacion(detalles, cicloActual) {
    const total = detalles.length
    const visitadas = detalles.filter(detalle => this.detalleVisitadoEnCiclo(detalle, cicloActual)).length
    const revisadas = detalles.filter(detalle => this.detalleRevisadoEnCiclo(detalle, cicloActual)).length
    const montoRecibido = detalles
      .filter(detalle => Number(detalle.ciclo ?? 0) === cicloActual)
      .reduce((totalMonto, detalle) => totalMonto + Number(detalle.monto_recibido ?? 0), 0)

    return {
      total,
      visitadas,
      revisadas,
      pendientes_revision: total - revisadas,
      monto_recibido: montoRecibido
    }
  }

  async detalleValidacionCompleto(detalleDoc, ruta) {
    const detalle = { detalle_ruta_cobros_id: detalleDoc.id, ...detalleDoc.data() }
    const contratoId = detalle.contratos_id ?? detalle.contrato_id
    const direccionCobroId = detalle.direccion_cobro_id ?? detalle.direcciones_cobro_id
    const cicloActual = this.cicloActual(ruta)

    const [contratoDoc, direccionDoc, pago] = await Promise.all([
      contratoId ? db.collection('contratos').doc(contratoId).get() : null,
      direccionCobroId ? db.collection('direcciones_cobro').doc(direccionCobroId).get() : null,
      this.pagoPorDetalleRuta(ruta.ruta_cobros_id, detalle.detalle_ruta_cobros_id, cicloActual)
    ])

    const contrato = contratoDoc?.exists
      ? { contratos_id: contratoDoc.id, ...contratoDoc.data() }
      : null
    const cliente = contrato?.clientes_id ? await this.clienteInfoById(contrato.clientes_id) : null
    const direccionCobro = direccionDoc?.exists
      ? { direcciones_cobro_id: direccionDoc.id, ...direccionDoc.data() }
      : null

    return {
      detalle,
      contrato,
      cliente,
      direccion_cobro: direccionCobro,
      pago
    }
  }

  async pagoPorDetalleRuta(rutaId, detalleId, cicloActual) {
    const pagoSnap = await db.collection('pagos')
      .where('ruta_cobros_id', '==', rutaId)
      .where('detalle_ruta_cobros_id', '==', detalleId)
      .where('ciclo_ruta', '==', cicloActual)
      .limit(1)
      .get()
    if (pagoSnap.empty) return null
    return await this.enriquecerPago({ pagos_id: pagoSnap.docs[0].id, id: pagoSnap.docs[0].id, ...pagoSnap.docs[0].data() })
  }

  cicloActual(ruta) {
    return Number(ruta.ciclo_actual ?? 1)
  }

  detalleVisitadoEnCiclo(detalle, cicloActual) {
    return Number(detalle.ciclo ?? 0) === cicloActual && Boolean(detalle.resultado || detalle.fecha_realizacion)
  }

  detalleRevisadoEnCiclo(detalle, cicloActual) {
    return Number(detalle.revision_ciclo ?? 0) === cicloActual && detalle.revisado === true
  }

  serializarFecha(fecha) {
    if (!fecha) return null
    if (fecha.toDate) return fecha.toDate().toISOString()
    if (fecha.seconds || fecha._seconds) return new Date((fecha.seconds ?? fecha._seconds) * 1000).toISOString()
    const parsed = new Date(fecha)
    return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
  }

  async getPagosByCliente(clienteID) {
    console.log('Buscando historial de pagos:', clienteID)
    const pagos = await db.collection("pagos").where('clienteID', '==', clienteID).orderBy('fechaPago', 'desc').get()
    if (pagos.empty) return []
    return pagos.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  }

  async buscarUltimoNumeroContrato() {
    const contratos = await db.collection("contratos").orderBy('fecha_creacion', 'desc').limit(1).get()
    if (contratos.empty) return 0
    const ultimoContrato = contratos.docs[0].data()
    return ultimoContrato.num_contrato || 0
  }
}
