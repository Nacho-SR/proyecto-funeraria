import { Router } from 'express'
import administrativosRoutes from '../modules/administrativos/administrativos.routes.js'
import cobradoresRoutes from '../modules/cobradores/cobradores.routes.js'
import contratosRoutes from '../modules/contratos/contratos.routes.js'
import serviciosRoutes from '../modules/servicios/servicios.routes.js'
import authRoutes from './auth.js'
import adminRoutes from './admin.js'
import usuariosRoutes from './usuarios.js'


const routes = Router()

routes.get('/health', (_, res) => res.json({ ok: true }))
routes.use('/administrativos', administrativosRoutes)
routes.use('/cobradores', cobradoresRoutes)
routes.use('/contratos', contratosRoutes)
routes.use('/servicios', serviciosRoutes)
routes.use('/auth', authRoutes)
routes.use('/admin', adminRoutes)
routes.use('/usuarios', usuariosRoutes)

export default routes