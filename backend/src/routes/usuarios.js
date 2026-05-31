import { Router } from 'express'
import { z } from 'zod'
import { db, admin } from '../config/firebase.js'
import { hashPassword, normalizeEmail, normalizeUser, publicUser, USERS_COLLECTION, verifyPassword } from '../modules/auth.js'
import { authenticate } from '../shared/middleware/auth.middleware.js'
import { requireRole } from '../shared/middleware/requireRole.middleware.js'

const router = Router()

const CreateUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  nombre: z.string().min(2),
  rol: z.enum(['cobrador', 'cliente']),
})

const PerfilSchema = z.object({
  telefono: z.string().regex(/^[0-9]{10}$/, 'Debe ser 10 dígitos'),
  calle: z.string().min(1),
  colonia: z.string().min(1),
  numCasa: z.string().min(1),
  municipio: z.string().min(1),
})

const UpdatePerfilSchema = z.object({
  nombre: z.string().trim().min(2),
  email: z.string().email(),
  passwordActual: z.string().optional().default(''),
  passwordNuevo: z.string().optional().default('')
}).superRefine((data, ctx) => {
  if (data.passwordNuevo && data.passwordNuevo.length < 6) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['passwordNuevo'],
      message: 'La nueva contrasena debe tener al menos 6 caracteres'
    })
  }

  if (data.passwordNuevo && !data.passwordActual) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['passwordActual'],
      message: 'Indica la contrasena actual'
    })
  }
})

// POST /api/usuarios/create
router.post('/create', authenticate, requireRole('admin'), async (req, res, next) => {
  try {
    const parsed = CreateUserSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Datos inválidos',
        errors: parsed.error.flatten(),
      })
    }

    const { email, password, nombre, rol } = parsed.data
    const normalizedEmail = normalizeEmail(email)

    const userSnapshot = await db.collection(USERS_COLLECTION)
      .where('email', '==', normalizedEmail)
      .limit(1)
      .get()

    if (!userSnapshot.empty) {
      return res.status(409).json({ message: 'El usuario ya existe' })
    }

    const userRef = db.collection(USERS_COLLECTION).doc()
    const passwordHash = await hashPassword(password)

    await userRef.set({
      email: normalizedEmail,
      nombre,
      rol,
      activo: true,
      passwordHash,
      perfilCompleto: false,
      fecha_creacion: admin.firestore.FieldValue.serverTimestamp(),
      fecha_modificacion: admin.firestore.FieldValue.serverTimestamp(),
    })

    return res.status(201).json({
      message: 'Usuario creado correctamente',
      email: normalizedEmail,
      rol,
    })
  } catch (error) {
    return next(error)
  }
})

// POST /api/usuarios/perfil
router.post('/perfil', authenticate, async (req, res, next) => {
  try {
    const parsed = PerfilSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Datos inválidos',
        errors: parsed.error.flatten(),
      })
    }

    const userRef = db.collection(USERS_COLLECTION).doc(req.user.sub)
    const userSnapshot = await userRef.get()

    if (!userSnapshot.exists) {
      return res.status(404).json({ message: 'Usuario no encontrado' })
    }

    await userRef.update({
      ...parsed.data,
      perfilCompleto: true,
      fecha_modificacion: admin.firestore.FieldValue.serverTimestamp(),
    })

    return res.status(200).json({ message: 'Perfil actualizado correctamente' })
  } catch (error) {
    return next(error)
  }
})

// PUT /api/usuarios/perfil
router.put('/perfil', authenticate, async (req, res, next) => {
  try {
    const parsed = UpdatePerfilSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Datos invalidos',
        errors: parsed.error.flatten(),
      })
    }

    const { nombre, email, passwordActual, passwordNuevo } = parsed.data
    const normalizedEmail = normalizeEmail(email)
    const userRef = db.collection(USERS_COLLECTION).doc(req.user.usuarios_id)
    const userSnapshot = await userRef.get()

    if (!userSnapshot.exists) {
      return res.status(404).json({ message: 'Usuario no encontrado' })
    }

    const usuarioActual = { id: userSnapshot.id, ...userSnapshot.data() }

    if (normalizedEmail !== normalizeEmail(usuarioActual.email)) {
      const existente = await db.collection(USERS_COLLECTION)
        .where('email', '==', normalizedEmail)
        .limit(1)
        .get()

      if (!existente.empty && existente.docs[0].id !== userSnapshot.id) {
        return res.status(409).json({ message: 'El correo ya esta en uso' })
      }
    }

    const update = {
      nombre,
      email: normalizedEmail,
      fecha_modificacion: admin.firestore.FieldValue.serverTimestamp(),
    }

    if (passwordNuevo) {
      const passwordValido = await verifyPassword(passwordActual, usuarioActual.passwordHash)
      if (!passwordValido) {
        return res.status(401).json({ message: 'La contrasena actual no es correcta' })
      }
      update.passwordHash = await hashPassword(passwordNuevo)
    }

    await userRef.update(update)

    const actualizado = await userRef.get()
    return res.status(200).json({
      message: 'Perfil actualizado correctamente',
      usuario: publicUser(normalizeUser({ id: actualizado.id, ...actualizado.data() }))
    })
  } catch (error) {
    return next(error)
  }
})

export default router
