import { Router } from 'express'
import { z } from 'zod'
import { ensureAdminUser } from '../modules/admin.js'
import { authenticate } from '../shared/middleware/auth.middleware.js'
import { requireRole } from '../shared/middleware/requireRole.middleware.js'

const router = Router()

const CreateAdminSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

router.post('/create', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
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
      rol: 'admin',
    })
  } catch (error) {
    return next(error)
  }
})

export default router
