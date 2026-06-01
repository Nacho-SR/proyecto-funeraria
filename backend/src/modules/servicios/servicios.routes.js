/*
  Rutas REST para servicios (baja lógica y futuras extensiones).
*/
import { Router } from 'express'
import { authenticate } from '../../shared/middleware/auth.middleware.js'
import { asyncHandler } from '../../shared/utils/asyncHandler.js'
import * as Ctrl from './servicios.controller.js'

const router = Router()

router.get('/', authenticate, asyncHandler(Ctrl.listar))
router.patch('/:id/baja', authenticate, asyncHandler(Ctrl.darDeBaja))

export default router
