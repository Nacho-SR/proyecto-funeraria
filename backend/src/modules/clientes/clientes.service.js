import bcrypt from 'bcrypt'
import { admin } from '../../config/firebase.js'
import { ApiError } from '../../shared/utils/apiError.js'
import { ClientesRepository } from './clientes.repository.js'

export class ClientesService {
  constructor () {
    this.repo = new ClientesRepository()
  }

  async crearNuevoBeneficiario(data) {
    console.log('Creando nuevo beneficiario con data:', data)
    console.log('Validando si el beneficiario ya existe con nombre:', data.beneficiario.nombre)
    if (await this.repo.findUserByEmail(data.beneficiario.nombre)) {
      throw new ApiError(409, 'El beneficiario ya existe')
    }

    const beneficiario = {
      ...data.beneficiario,
      fecha_creacion: beneficiarios.firestore.FieldValue.serverTimestamp(),
      fecha_modificacion: beneficiarios.firestore.FieldValue.serverTimestamp()
    }

    const nuevoBeneficiario = await this.repo.crearNuevoBeneficiario(beneficiario)
    return { nuevoBeneficiario }
  }
}