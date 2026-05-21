import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import routes from './routes/index.js'
import { env } from './config/env.js'
import { errorHandler } from './shared/middleware/errorHandler.middleware.js'
import './config/firebase.js'

const app = express()
app.use(helmet())
const domains = env.CORS_ORIGIN === '*' ? '*' : env.CORS_ORIGIN.split(',')
const corsOptions = {
  origin: domains,
  methods: ['GET', 'POST', 'DELETE', 'PATCH', 'PUT'],
  allowedHeaders: ['Content-Type', 'Authorization']
}
app.use(cors(corsOptions))
app.use(express.json({ limit: '1mb' }))
app.use('/api', routes)
app.use(errorHandler)
app.listen(env.PORT, () => {
  console.log(`API running on port ${env.PORT}`)
})