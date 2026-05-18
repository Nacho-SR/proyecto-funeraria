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

  async listarClientesActivos() {
    return await this.repo.listarClientesActivos()
  }

  async listarCobradoresActivos() {
    return await this.repo.listarCobradoresActivos()
  }

  async listarProductosActivos() {
    return await this.repo.listarProductosActivos()
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

  async crearNuevoContrato(data) {
    // Aquí iría la lógica para crear un nuevo contrato, por ejemplo:
    // 1. Validar que el cliente y el paquete existan
    // 2. Crear el contrato en la base de datos
    // 3. Retornar la información del contrato creado
    if (!data.clientes_id && !data.nuevo_cliente) {
      throw new ApiError(400, 'Debe proporcionar clientes_id o nuevo_cliente')
    }
    if (data.nuevo_cliente) {
      const nuevoCliente = await this.crearNuevoCliente(data.nuevo_cliente)
      data.clientes_id = nuevoCliente.id
      delete data.nuevo_cliente
    }

    const ultimoNumero = await this.repo.buscarUltimoNumeroContrato()
    const nuevoNumContrato = await this.generarNuevoNumContrato(ultimoNumero, new Date())

    const nuevoContrato = {
      ...data,
      precio_final: 0,
      abonado: 0,
      estado: 'activo',
      num_contrato: nuevoNumContrato,
      fecha_creacion: admin.firestore.FieldValue.serverTimestamp(),
      fecha_modificacion: admin.firestore.FieldValue.serverTimestamp()
    }

    const createdContrato = await this.repo.crearContrato(nuevoContrato)
    return createdContrato
  }
  

  async crearPaqueteAdicional(data) {
    if ((data.hasOwnProperty('paquete') == false && data.hasOwnProperty('adicional') == false) && (data.hasOwnProperty('paquete_id') == false && data.hasOwnProperty('adicional_id') == false )) {
      throw new ApiError(400, 'Datos de paquete y/o adicional son requeridos')
    }

    if(data.hasOwnProperty('paquete_id') && data.hasOwnProperty('adicional_id')) {
      const { paquete_id, adicional_id } = data

      const paqueteSnap = await this.repo.findPaqueteById(paquete_id)
      console.log('paqueteSnap:', paqueteSnap)
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