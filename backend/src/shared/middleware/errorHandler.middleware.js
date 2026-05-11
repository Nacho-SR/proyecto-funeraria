import { ApiError } from '../utils/apiError.js'
import { ZodError } from 'zod'

export function errorHandler(err, req, res, next) {
  if(err instanceof ZodError) {
    return res.status(400).json({
      message: 'Error en la validacion',
      details: err.errors
    })
  }
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      message: err.message
    })
  }
  console.log('Error => ', err)
  return res.status(500).json({
    message: 'Error interno del servidor'
  })
}