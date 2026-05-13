/*
 Rutas para el módulo de administrativos, incluyendo la ruta para registrar clientes.
*/
import { Router } from 'express'
import { asyncHandler } from '../../shared/utils/asyncHandler.js'
import { authenticate } from '../../shared/middleware/auth.middleware.js'
import * as Ctrl from './administrativos.controller.js'

const router = Router()

// Todas las req usan JWT
//router.use(authenticate)
router.post('/alta-cliente', asyncHandler(Ctrl.crearCliente))
router.post('/editar-cliente', asyncHandler(Ctrl.editarCliente))
router.post('/alta-cobrador', asyncHandler(Ctrl.crearCobrador))
router.post('/editar-cobrador', asyncHandler(Ctrl.editarCobrador))

export default router