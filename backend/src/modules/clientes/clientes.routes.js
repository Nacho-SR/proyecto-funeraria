import { Router } from 'express'
import { asyncHandler } from '../../shared/utils/asyncHandler.js'
import { authenticate } from '../../shared/middleware/auth.middleware.js'
import * as ctrl from './clientes.controller.js'

const router = Router()

console.log("🛠️ Cargando rutas de clientes...")

router.post('/nuevo-pago', asyncHandler(ctrl.nuevoPago))
router.get('/:clienteID/pagos', asyncHandler(ctrl.obtenerPagosPorCliente))

import * as Ctrl from './clientes.controller.js'

router.post('/alta-beneficiario', asyncHandler(Ctrl.altaBeneficiario))
router.post('/actualizar-beneficiario', asyncHandler(Ctrl.actualizarBeneficiario))

export default router
