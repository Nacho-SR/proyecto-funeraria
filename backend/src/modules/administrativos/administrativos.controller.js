/*
  Controlador para la gestión de administrativos, incluyendo el registro de usuarios.
*/
import { createClientesSchema } from '../clientes/clientes.schema.js'
import { nuevoClienteSchema, nuevoCobradorSchema } from './asignaciones.schema.js'
import { createCobradoresSchema } from '../cobradores/cobradores.schema.js'
import { AdministrativosService } from './administrativos.service.js'
import { ApiError } from '../../shared/utils/apiError.js'

const service = new AdministrativosService()

export const crearCliente = async (req, res) => {
  const doc = nuevoClienteSchema.parse(req.body)
  const created = await service.crearNuevoCliente(doc)
  res.status(201).json(created)
}

export const crearCobrador = async (req, res) => {
  const doc = nuevoCobradorSchema.parse(req.body)
  const created = await service.crearNuevoCobrador(doc)
  res.status(201).json(created)
}