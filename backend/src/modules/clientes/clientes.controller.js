import nuevoPagoSchema from  'backend/src/modules/pagos/pagos.schema.js'
import pagoSchema from  'backend/src/modules/pagos/pagos.schema.js'
import { ClientesService } from './clientes.service.js'
import { ApiError } from '../../shared/utils/apiError.js'

const service = new ClientesService()

export const nuevoPago = async (req, res) => {
    const doc = nuevoPagoSchema.parse(req.body)
    const created = await service.crearNuevoPago(doc)
    res.status(201).json(created)
}
