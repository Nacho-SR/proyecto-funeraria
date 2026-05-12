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

const PerfilSchema = z.object({
  telefono: z.string().regex(/^[0-9]{10}$/, 'Debe ser 10 dígitos'),
  calle: z.string().min(1),
  colonia: z.string().min(1),
  numCasa: z.string().min(1),
  municipio: z.string().min(1),
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
      perfilCompleto: false,
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

// POST /api/usuarios/perfil
router.post('/perfil', async (req, res, next) => {
  try {
    // Obtener el token del header
    const authHeader = req.headers.authorization
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'No autorizado' })
    }

    const parsed = PerfilSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Datos inválidos',
        errors: parsed.error.flatten(),
      })
    }

    // Decodificar el token para obtener el email (sub)
    const jwt = await import('jsonwebtoken')
    const token = authHeader.split(' ')[1]
    const { env } = await import('../config/env.js')
    const decoded = jwt.default.verify(token, env.JWT_SECRET)

    // El sub es el email (id del documento en Firestore)
    const userRef = db.collection(USERS_COLLECTION).doc(decoded.sub)
    const userSnapshot = await userRef.get()

    if (!userSnapshot.exists) {
      return res.status(404).json({ message: 'Usuario no encontrado' })
    }

    await userRef.update({
      ...parsed.data,
      perfilCompleto: true,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    })

    return res.status(200).json({ message: 'Perfil actualizado correctamente' })
  } catch (error) {
    return next(error)
  }
})

export default router