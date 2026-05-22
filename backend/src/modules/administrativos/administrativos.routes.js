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
router.get('/clientes-activos', asyncHandler(Ctrl.listarClientesActivos))
router.get('/cobradores-activos', asyncHandler(Ctrl.listarCobradoresActivos))
router.get('/productos-activos', asyncHandler(Ctrl.listarProductosActivos))
router.get('/rutas-cobro-activas', asyncHandler(Ctrl.listarRutasCobro))
router.get('/detalles-cobro/:id', asyncHandler(Ctrl.obtenerDetallesCobro))
router.get('/info-contratos',asyncHandler(Ctrl.obtenerInfoContratos))
router.get('/:clienteID/pagos', asyncHandler(Ctrl.obtenerPagosPorCliente))
router.post('/alta-cliente', asyncHandler(Ctrl.crearCliente))
router.post('/alta-cobrador', asyncHandler(Ctrl.crearCobrador))
router.post('/nuevo-contrato', asyncHandler(Ctrl.crearContrato))
router.post('/alta-paquete-adicional', asyncHandler(Ctrl.crearPaqueteAdicional))
router.post('/nueva-ruta-cobro', asyncHandler(Ctrl.crearRutaCobro))
router.post('/nuevo-pago', asyncHandler(Ctrl.nuevoPago))
router.put('/baja-cliente/:id', asyncHandler(Ctrl.darBajaCliente))

export default router
