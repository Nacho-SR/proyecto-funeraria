import { ApiError } from '../../shared/utils/apiError.js'
import { ClientesRepository } from './clientes.repo.js'
import { FieldValue } from 'firebase-admin/firestore'
import bcrypt from 'bcrypt'
import { admin } from '../../config/firebase.js'

export class ClientesService {
    constructor () {
        this.repo = new ClientesRepository()
    }

  async listarContratosActivos(usuarioId) {
    const cliente = await this.repo.findClienteByUsuarioId(usuarioId)
    if (!cliente) {
      throw new ApiError(404, 'No se encontro el perfil de cliente asociado al usuario')
    }

    const contratos = await this.repo.listarContratosPorCliente(cliente.clientes_id)
    return contratos.filter(contrato =>
      contrato.activo !== false &&
      (contrato.estado ?? 'activo') === 'activo'
    )
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
