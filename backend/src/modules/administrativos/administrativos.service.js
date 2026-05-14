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

  async crearNuevoCliente(data) {
    console.log('Creando nuevo cliente con data:', data)
    console.log('Validando si el usuario ya existe con email:', data.usuario.email)
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
      usuarios_id: nuevoUsuario.id,
      fecha_creacion: admin.firestore.FieldValue.serverTimestamp(),
      fecha_modificacion: admin.firestore.FieldValue.serverTimestamp()
    }
    const infoCliente = await this.repo.crearCliente(cliente)
    return { ...this.sanitizeUsuario(nuevoUsuario), ...infoCliente }
  }

  async crearNuevoCobrador(data) {
    console.log('Creando nuevo cobrador con datos: ', data)
    console.log('Validando si el usuario ya existe con email:', data.usuario.email)
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

    const cobrador = {
      ...data.cobrador,
      activo: data.activo ?? true,
      fecha_creacion: admin.firestore.FieldValue.serverTimestamp(),
      fecha_modificacion: admin.firestore.FieldValue.serverTimestamp()
    }
    const nuevoUsuario = await this.repo.crearUsuario(usuario)
    const infoCobrador = await this.repo.crearCobrador(cobrador)
    return { ...this.sanitizeUsuario(nuevoUsuario), ...infoCobrador }
  }

  async crearPaqueteAdicional(data) {
    if (!data) {
      throw new ApiError(400, 'Datos de paquete y/o adicional son requeridos')
    }

    if (data.hasOwnProperty('paqueteAdicional')) {
      if (await this.repo.findPromoByIds(data.paqueteAdicional.paquete_id, data.paqueteAdicional.adicional_id)) {
        throw new ApiError(409, 'La combinación de paquete y adicional ya existe')
      }
      
      return await this.repo.crearPromo(data.paqueteAdicional)
    }
    
    if (data.hasOwnProperty('paquete')) {
      if (await this.repo.findPaqueteByName(data.paquete.nombre)) {
        throw new ApiError(409, 'Un paquete ya existe con ese nombre')
      }

      return await this.repo.crearNuevoPaquete(data.paquete)
    }

    if (data.hasOwnProperty('adicional')) {
      if (await this.repo.findAdicionalByName(data.adicional.nombre)) {
        throw new ApiError(409, 'Un adicional ya existe con ese nombre')
      }

      return await this.repo.crearNuevoAdicional(data.adicional)
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