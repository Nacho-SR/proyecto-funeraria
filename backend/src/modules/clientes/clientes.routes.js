import { Router } from 'express'
import { asyncHandler } from '../../shared/utils/asyncHandler.js'
import { authenticate } from '../../shared/middleware/auth.middleware.js'
import * as Ctrl from './clientes.controller.js'

const router = Router()

router.post('/alta-beneficiario', asyncHandler(Ctrl.altaBeneficiario))
router.post('/actualizar-beneficiario', asyncHandler(Ctrl.actualizarBeneficiario))

export default router