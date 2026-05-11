import bcrypt from 'bcrypt'
import { admin } from '../../config/firebase.js'
import { ApiError } from '../../shared/utils/apiError.js'
import { administrativosRepository } from './administrativos.repository.js'

export class AdministrativosService {
  constructor () {
    this.repository = administrativosRepository
  }

  sanitizeUsuario (usuario) {
    const { password, ...safe } = usuario
    return safe
  }

  nombreCompleto ({ nombre, apaterno, amaterno }) {
    return `${nombre} ${apaterno} ${amaterno}`.trim()
  }

  async crearUsuario(data) {
    if (await this.repo.findUserByEmail(data.email)) {
      throw new ApiError(409, 'Usuario ya existe')
    }

    const passwordHash = await bcrypt.hash(data.password, 10)

    const nuevo = {
      ...data,
      passwordHash,
      activo: data.activo ?? true,
      fecha_creacion: admin.firestore.FieldValue.serverTimestamp(),
      fecha_modificacion: admin.firestore.FieldValue.serverTimestamp()
    }

    delete nuevo.password

    const created = await this.repo.crearUsuario(nuevo)
    return this.sanitize(created)
  }
}