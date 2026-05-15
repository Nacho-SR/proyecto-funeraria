import { Router } from 'express'
import administrativosRoutes from '../modules/administrativos/administrativos.routes.js'
import contratosRoutes from '../modules/contratos/contratos.routes.js'
import authRoutes from './auth.js'
import adminRoutes from './admin.js'
import usuariosRoutes from './usuarios.js'

const routes = Router()

routes.get('/health', (_, res) => res.json({ ok: true }))
routes.use('/administrativos', administrativosRoutes)
routes.use('/contratos', contratosRoutes)
routes.use('/auth', authRoutes)
routes.use('/admin', adminRoutes)
routes.use('/usuarios', usuariosRoutes)

export default routes