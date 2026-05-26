import { Router } from 'express'
import { asyncHandler } from '../../shared/utils/asyncHandler.js'
import { authenticate } from '../../shared/middleware/auth.middleware.js'
import { requireRole } from '../../shared/middleware/requireRole.middleware.js'
import * as Ctrl from './cobradores.controller.js'

const router = Router()

router.patch('/:id/baja', authenticate, requireRole('admin'), asyncHandler(Ctrl.darDeBaja))

router.use(authenticate)
router.use(requireRole('cobrador'))

router.get('/rutas-cobro', asyncHandler(Ctrl.listarRutasCobro))
router.get('/rutas-cobro/:id', asyncHandler(Ctrl.obtenerRutaCobro))
router.patch('/rutas-cobro/:id/iniciar', asyncHandler(Ctrl.iniciarRutaCobro))
router.post('/rutas-cobro/:id/detalles/:detalleId/resultado', asyncHandler(Ctrl.registrarResultado))

export default router
