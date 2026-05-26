import { CobradoresService } from './cobradores.service.js'
import { CobradoresRepository } from './cobradores.repository.js'
import { registrarResultadoSchema } from './cobradores.rutas.schema.js'
import { ApiError } from '../../shared/utils/apiError.js'

const service = new CobradoresService()
const repo = new CobradoresRepository()

export const listarRutasCobro = async (req, res) => {
  const rutas = await service.listarRutasCobro(req.user.usuarios_id)
  res.status(200).json({ rutas })
}

export const obtenerRutaCobro = async (req, res) => {
  const ruta = await service.obtenerRutaCobro(req.user.usuarios_id, req.params.id)
  res.status(200).json({ ruta })
}

export const iniciarRutaCobro = async (req, res) => {
  const ruta = await service.iniciarRutaCobro(req.user.usuarios_id, req.params.id)
  res.status(200).json({ ruta })
}

export const registrarResultado = async (req, res) => {
  const payload = registrarResultadoSchema.parse(req.body)
  const resultado = await service.registrarResultado({
    usuariosId: req.user.usuarios_id,
    rutaId: req.params.id,
    detalleId: req.params.detalleId,
    payload
  })
  res.status(200).json(resultado)
}

export const darDeBaja = async (req, res) => {
  if (req.user.rol !== 'admin') {
    throw new ApiError(403, 'Solo administradores pueden dar de baja cobradores')
  }

  const id = req.params.id?.trim()
  if (!id) {
    throw new ApiError(400, 'Identificador de cobrador requerido')
  }

  const resultado = await repo.darBajaLogica(id)
  res.status(200).json({
    message: 'Cobrador dado de baja correctamente',
    ...resultado
  })
}
