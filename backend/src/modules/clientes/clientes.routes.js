import { Router } from 'express'
import { asyncHandler } from '../../shared/utils/asyncHandler.js'
import { authenticate } from '../../shared/middleware/auth.middleware.js'
import { requireRole } from '../../shared/middleware/requireRole.middleware.js'
import * as ctrl from './clientes.controller.js'

const router = Router()

import * as Ctrl from './clientes.controller.js'

router.use(authenticate)
router.use(requireRole('cliente'))

router.get('/mis-contratos', asyncHandler(ctrl.listarMisContratos))
router.post('/alta-beneficiario', asyncHandler(Ctrl.altaBeneficiario))
router.post('/actualizar-beneficiario', asyncHandler(Ctrl.actualizarBeneficiario))

export default router
