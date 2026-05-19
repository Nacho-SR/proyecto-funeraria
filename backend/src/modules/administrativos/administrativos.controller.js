/*
  Controlador para la gestión de administrativos, incluyendo el registro de usuarios.
*/
import { createClientesSchema } from '../clientes/clientes.schema.js'
import { nuevoClienteSchema, nuevoCobradorSchema, createPaqueteAdicionalSchema, createContratoSchema } from './asignaciones.schema.js'
import { createCobradoresSchema } from '../cobradores/cobradores.schema.js'
import { AdministrativosService } from './administrativos.service.js'
import { ApiError } from '../../shared/utils/apiError.js'

const service = new AdministrativosService()

export const listarClientesActivos = async (req, res) => {
  const clientes = await service.listarClientesActivos()
  res.status(200).json({ clientes })
}

export const listarCobradoresActivos = async (req, res) => {
  const cobradores = await service.listarCobradoresActivos()
  res.status(200).json({ cobradores })
}

export const listarProductosActivos = async (req, res) => {
  const productosActivos = await service.listarProductosActivos()
  res.status(200).json({ productosActivos })
}

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

export const crearContrato = async (req, res) => {
  const doc = createContratoSchema.parse(req.body)
  const created = await service.crearNuevoContrato(doc)
  res.status(201).json(created)
}

export const crearPaqueteAdicional = async (req, res) => {
  const doc = createPaqueteAdicionalSchema.parse(req.body)
  const created = await service.crearPaqueteAdicional(doc)
  res.status(201).json(created)
}

export const crearRutaCobro = async (req, res) => {
  const doc = nuevaRutaCobroSchema.parse(req.body)
  const created = await service.crearRutaCobro(doc)
  res.status(201).json(created)
}

export const darBajaCliente = async (req, res) => {
  const clienteId = req.params.id
  try {
    await service.darBajaCliente(clienteId)
    res.status(200).json({ message: 'Cliente dado de baja exitosamente' })
  } catch (error) {
    if (error instanceof ApiError) {
      res.status(error.statusCode).json({ error: error.message })
    } else {
      res.status(500).json({ error: 'Error interno del servidor' })
    }
  }
}