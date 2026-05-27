/*
  Controlador HTTP para operaciones sobre contratos.
*/
import { ContratosRepository } from './contratos.repository.js'
import { ApiError } from '../../shared/utils/apiError.js'

const repo = new ContratosRepository()

export const listar = async (req, res) => {
  if (req.user.rol !== 'admin') {
    throw new ApiError(403, 'Solo administradores pueden consultar contratos')
  }

  const contratos = await repo.listar()
  res.status(200).json(contratos)
}

export const darDeBaja = async (req, res) => {
  if (req.user.rol !== 'admin') {
    throw new ApiError(403, 'Solo administradores pueden dar de baja contratos')
  }

  const id = req.params.id?.trim()
  if (!id) {
    throw new ApiError(400, 'Identificador de contrato requerido')
  }

  const resultado = await repo.darBajaLogica(id)
  res.status(200).json({
    message: 'Contrato dado de baja correctamente',
    ...resultado
  })
}
