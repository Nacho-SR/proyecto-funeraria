import { Router } from 'express'

const routes = Router()

routes.get('/health', (_, res) => {
  res.json({
    message: 'Servidor de API funcionando c;',
    ok: true
  })
})


export default routes