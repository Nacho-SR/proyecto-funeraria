import { Router } from 'express'
import { z } from 'zod'
import { db, admin } from '../config/firebase.js'
import { hashPassword, normalizeEmail, USERS_COLLECTION } from '../modules/auth.js'

const router = Router()

const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  nombre: z.string().min(2),
  role: z.enum(['cobrador', 'cliente']),
})

// POST /api/usuarios/create
router.post('/create', async (req, res, next) => {
  try {
    const parsed = CreateUserSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Datos inválidos',
        errors: parsed.error.flatten(),
      })
    }

    const { email, password, nombre, role } = parsed.data
    const normalizedEmail = normalizeEmail(email)

    const userRef = db.collection(USERS_COLLECTION).doc(normalizedEmail)
    const userSnapshot = await userRef.get()

    if (userSnapshot.exists) {
      return res.status(409).json({ message: 'El usuario ya existe' })
    }

    const passwordHash = await hashPassword(password)

    await userRef.set({
      email: normalizedEmail,
      nombre,
      role,
      passwordHash,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    return res.status(201).json({
      message: 'Usuario creado correctamente',
      email: normalizedEmail,
      role,
    })
  } catch (error) {
    return next(error)
  }
})

export default router