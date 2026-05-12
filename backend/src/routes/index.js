import { Router } from 'express'
import administrativosRoutes from '../modules/administrativos/administrativos.routes.js'

const routes = Router()

routes.get('/health', (_, res) => {
  res.json({
    message: 'Servidor de API funcionando c;',
    ok: true
  })
})

routes.use('/administrativos', administrativosRoutes)

export default routes