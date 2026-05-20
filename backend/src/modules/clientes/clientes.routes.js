import { Router } from 'express'
import { asyncHandler } from '../../shared/utils/asyncHandler.js'
import { authenticate } from '../../shared/middleware/auth.middleware.js'
import * as ctrl from './clientes.controller.js'

const router = Router()

console.log("🛠️ Cargando rutas de clientes...")

router.post('/nuevo-pago', asyncHandler(ctrl.nuevoPago))

export default router
