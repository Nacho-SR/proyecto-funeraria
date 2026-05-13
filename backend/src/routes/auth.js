import { Router } from 'express'
import { z } from 'zod'
import { getUserByEmail, verifyPassword, signToken, normalizeEmail } from '../modules/auth.js'

const router = Router()

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(['cliente', 'cobrador', 'admin']),
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

    const { email, password, role } = parsed.data
    const user = await getUserByEmail(email)

    if (!user || !user.passwordHash) {
      return res.status(401).json({ message: 'Credenciales incorrectas' })
    }

    const isPasswordValid = await verifyPassword(password, user.passwordHash)
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Credenciales incorrectas' })
    }

    if (user.role !== role) {
      return res.status(403).json({ message: 'El rol no coincide con este usuario' })
    }

    const token = signToken({ userId: user.id, role: user.role })

    return res.status(200).json({
      token,
      role: user.role,
      email: normalizeEmail(email),
    })
  } catch (error) {
    return next(error)
  }
})

export default router