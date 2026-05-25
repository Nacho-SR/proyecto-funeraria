import jwt from 'jsonwebtoken'
import { env } from '../../config/env.js'
import { ApiError } from '../utils/apiError.js'
import { getUserById, publicUser } from '../../modules/auth.js'

export async function authenticate (req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ','')
  if (!token) throw new ApiError(401, 'Token Requerido')

  try {
    const payload = jwt.verify(token, env.JWT_SECRET)
    const user = await getUserById(payload.sub)

    if (!user || !user.rol) {
      throw new ApiError(401, 'Sesion invalida')
    }
    if (!user.activo) {
      throw new ApiError(403, 'Usuario inactivo')
    }

    req.user = {
      ...payload,
      ...publicUser(user)
    }

    next()
  } catch (error) {
    if (error instanceof ApiError) return next(error)
    return next(new ApiError(401, 'Token invalido o expirado'))
  }
}
