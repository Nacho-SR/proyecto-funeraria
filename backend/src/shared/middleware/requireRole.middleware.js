import { ApiError } from '../utils/apiError.js'

export function requireRole(allowedRoles) {
  const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles]

  return (req, res, next) => {
    const rol = req.user?.rol

    if (!rol) {
      throw new ApiError(401, 'No autenticado')
    }

    if (!roles.includes(rol)) {
      throw new ApiError(403, 'No autorizado')
    }

    next()
  }
}
