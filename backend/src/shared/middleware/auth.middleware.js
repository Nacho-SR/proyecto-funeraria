import jwt from 'jsonwebtoken'
import { env } from '../../config/env.js'
import { ApiError } from '../utils/apiError.js'

export function authenticate (req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ','')
  if (!token) throw new ApiError(401, 'Token Requerido')
  req.user = jwt.verify(token, env.JWT_SECRET)
  next()
}