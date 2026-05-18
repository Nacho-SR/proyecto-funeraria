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

    const cliente = {
      ...data.cliente,
      activo: data.activo ?? true,
      fecha_creacion: admin.firestore.FieldValue.serverTimestamp(),
      fecha_modificacion: admin.firestore.FieldValue.serverTimestamp()
    }

    const nuevoUsuario = await this.repo.crearUsuario(usuario)
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

  async crearNuevoContrato(data) {
    // Aquí iría la lógica para crear un nuevo contrato, por ejemplo:
    // 1. Validar que el cliente y el paquete existan
    // 2. Crear el contrato en la base de datos
    // 3. Retornar la información del contrato creado
    if (!data.cliente_id && !data.nuevo_cliente) {
      throw new ApiError(400, 'Debe proporcionar cliente_id o nuevo_cliente')
    }
    if (data.nuevo_cliente) {
      const nuevoCliente = await this.crearNuevoCliente(data.nuevo_cliente)
      data.cliente_id = nuevoCliente.id
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
  
}