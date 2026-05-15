/*
  Controlador HTTP para operaciones sobre servicios.
*/
import { ServiciosRepository } from './servicios.repository.js'
import { ApiError } from '../../shared/utils/apiError.js'

const repo = new ServiciosRepository()

export const darDeBaja = async (req, res) => {
  if (req.user.role !== 'admin') {
    throw new ApiError(403, 'Solo administradores pueden dar de baja servicios')
  }

  const id = req.params.id?.trim()
  if (!id) {
    throw new ApiError(400, 'Identificador de servicio requerido')
  }

  const resultado = await repo.darBajaLogica(id)
  res.status(200).json({
    message: 'Servicio dado de baja correctamente',
    ...resultado
  })
}
