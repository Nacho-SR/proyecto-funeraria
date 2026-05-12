import { Router } from 'express'
import administrativosRoutes from '../modules/administrativos/administrativos.routes.js'
import authRoutes from './auth.js'
import adminRoutes from './admin.js'

const routes = Router()

routes.get('/health', (_, res) => res.json({ ok: true }))
routes.use('/administrativos', administrativosRoutes)
routes.use('/auth', authRoutes)
routes.use('/admin', adminRoutes)

export default routes