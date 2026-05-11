/*
 Controlador para la gestión de administrativos, incluyendo el registro de clientes.
*/
import { createClientesSchema } from '../clientes/clientes.schema.js'
import { createUsuarioSchema } from './asignaciones.schema.js'
import { AdministrativosService } from './administrativos.service.js'
import { ApiError } from '../../shared/utils/apiError.js'

const service = new AdministrativosService()

export async function altaCliente (req, res) {
  const { error, value } = createClientesSchema.safeParse(req.body)
  if (error) {
    throw new ApiError(400, 'Datos de cliente inválidos', error.errors)
  }
}