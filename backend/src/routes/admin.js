import { Router } from 'express'
import { z } from 'zod'
import { env } from '../config/env.js'
import { ensureAdminUser } from '../modules/admin.js'

const router = Router()

const CreateAdminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

router.post('/create', async (req, res, next) => {
  try {
    const masterKey = req.header('x-master-key')
    if (!masterKey || masterKey !== env.MASTER_ADMIN_KEY) {
      return res.status(401).json({ message: 'No autorizado' })
    }

    const parsed = CreateAdminSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Datos inválidos',
        errors: parsed.error.flatten(),
      })
    }

    const result = await ensureAdminUser(parsed.data)

    if (!result.created) {
      return res.status(409).json({ message: 'El usuario ya existe' })
    }

    return res.status(201).json({
      message: 'Usuario admin creado',
      email: result.email,
      role: 'admin',
    })
  } catch (error) {
    return next(error)
  }
})

export default router