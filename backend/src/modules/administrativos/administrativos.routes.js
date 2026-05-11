/*
 Rutas para el módulo de administrativos, incluyendo la ruta para registrar clientes.
*/
import { Router } from 'express'
import { asyncHandler } from '../../shared/utils/asyncHandler.js'
import { authenticate } from '../../shared/middleware/auth.middleware.js'
import * as Ctrl from './administrativos.controller.js'

const router = Router()

// Todas las req usan JWT
router.use(authenticate)
router.post('/', asyncHandler(Ctrl.create))
router.get('/', asyncHandler(Ctrl.getAll))
router.patch('/:id', asyncHandler(Ctrl.update))
router.delete('/:id', asyncHandler(Ctrl.remove))
router.get('/usuario/:usuario', asyncHandler(Ctrl.getByUsuario))

export default router