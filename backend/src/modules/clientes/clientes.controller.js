/*
 Controlador para la gestión de beneficiarios para los clientes.
*/
import { createBeneficiariosSchema } from '../beneficiarios/beneficiarios.schema.js'
import { updateBeneficiariosSchema } from '../beneficiarios/beneficiarios.schema.js'
import { ApiError } from '../../shared/utils/apiError.js'

const service = new AdministrativosService()

export async function altaBeneficiario (req, res) {
  const { error, value } = createBeneficiariosSchema.safeParse(req.body)
  if (error) {
    throw new ApiError(400, 'Datos de beneficiario inválidos', error.errors)
  }
}

export async function actualizarBeneficiario (req, res) {
  const { error, value } = updateBeneficiariosSchema.safeParse(req.body)
  if (error) {
    throw new ApiError(400, 'Datos de beneficiario inválidos', error.errors)
  }
}
