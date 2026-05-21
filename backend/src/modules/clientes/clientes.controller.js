import { nuevoPagoSchema } from '../pagos/pagos.schema.js';
import { ClientesService } from './clientes.service.js';
import { ApiError } from '../../shared/utils/apiError.js';

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