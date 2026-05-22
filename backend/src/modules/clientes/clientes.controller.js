import { nuevoPagoSchema } from '../pagos/pagos.schema.js';
import { ClientesService } from './clientes.service.js';
import { ApiError } from '../../shared/utils/apiError.js';
import { AdministrativosService } from '../administrativos/administrativos.service.js';

const service = new ClientesService()

export const nuevoPago = async (req, res) => {
    const doc = nuevoPagoSchema.parse(req.body)
    const created = await service.nuevoPago(doc)
    res.status(201).json(created)
}

export const obtenerPagosPorCliente = async (req, res) => {
    const { clienteID } = req.params
    const historial = await service.obtenerHistorialCliente(clienteID)
    res.status(200).json(historial)
}
/*
 Controlador para la gestión de beneficiarios para los clientes.
*/
import { createBeneficiariosSchema } from '../beneficiarios/beneficiarios.schema.js'
import { updateBeneficiariosSchema } from '../beneficiarios/beneficiarios.schema.js'

const serviceA = new AdministrativosService()

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
