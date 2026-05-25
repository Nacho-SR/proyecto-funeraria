import { Router } from 'express'
import { z } from 'zod'
import { authenticate } from '../shared/middleware/auth.middleware.js'
import { getUserByEmail, verifyPassword, signToken, publicUser } from '../modules/auth.js'

const router = Router()

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
})

router.post('/login', async (req, res, next) => {
  try {
    const parsed = LoginSchema.safeParse(req.body)

    if (!parsed.success) {
      return res.status(400).json({
        message: 'Datos de login inválidos',
        errors: parsed.error.flatten(),
      })
    }

    const { email, password } = parsed.data
    const user = await getUserByEmail(email)

    if (!user || !user.passwordHash || !user.rol) {
      return res.status(401).json({ message: 'Credenciales incorrectas' })
    }

    if (!user.activo) {
      return res.status(403).json({ message: 'Usuario inactivo' })
    }

    const isPasswordValid = await verifyPassword(password, user.passwordHash)
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Credenciales incorrectas' })
    }

    const token = signToken({ userId: user.usuarios_id, rol: user.rol })

    return res.status(200).json({
      token,
      usuario: publicUser(user),
    })
  } catch (error) {
    return next(error)
  }
})

router.get('/me', authenticate, async (req, res, next) => {
  try {
    return res.status(200).json({ usuario: req.user })
  } catch (error) {
    return next(error)
  }
})

export default router
