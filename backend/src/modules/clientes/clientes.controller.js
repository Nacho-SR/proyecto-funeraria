import { nuevoPagoSchema } from '../pagos/pagos.schema.js';
import { ClientesService } from './clientes.service.js';
import { ApiError } from '../../shared/utils/apiError.js';
import { AdministrativosService } from '../administrativos/administrativos.service.js';
import { createBeneficiariosSchema } from '../beneficiarios/beneficiarios.schema.js'
import { updateBeneficiariosSchema } from '../beneficiarios/beneficiarios.schema.js'

const serviceA = new AdministrativosService()
const service = new ClientesService()

export async function listarMisContratos (req, res) {
  const contratos = await service.listarContratosActivos(req.user.usuarios_id)
  res.status(200).json({ contratos })
}

export async function listarMisPagos (req, res) {
  const pagos = await service.listarMisPagos(req.user.usuarios_id)
  res.status(200).json({ pagos })
}

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
