import { Router } from 'express'
import administrativosRoutes from '../modules/administrativos/administrativos.routes.js'
import authRoutes from './auth.js'
import adminRoutes from './admin.js'
import usuariosRoutes from './usuarios.js'
import clientesRoutes from '../modules/clientes/clientes.routes.js'
import cobradoresRoutes from '../modules/cobradores/cobradores.routes.js'

const routes = Router()

routes.get('/health', (_, res) => res.json({ ok: true }))

// Las rutas conectadas correctamente con la variable "routes"
routes.use('/administrativos', administrativosRoutes)
routes.use('/auth', authRoutes)
routes.use('/admin', adminRoutes)
routes.use('/usuarios', usuariosRoutes)
routes.use('/cobrador', cobradoresRoutes)
routes.use('/clientes', clientesRoutes) // <-- Corregido aquí

export default routes
