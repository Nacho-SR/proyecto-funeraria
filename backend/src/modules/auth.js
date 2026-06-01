import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { db } from '../config/firebase.js'
import { env } from '../config/env.js'

export const USERS_COLLECTION = 'usuarios'
const PASSWORD_SALT_ROUNDS = 10
const ROLES = ['admin', 'cobrador', 'cliente']

export function normalizeEmail(email) {
  return email.trim().toLowerCase()
}

export async function hashPassword(password) {
  return bcrypt.hash(password, PASSWORD_SALT_ROUNDS)
}

export async function verifyPassword(password, passwordHash) {
  return bcrypt.compare(password, passwordHash)
}

export async function getUserByEmail(email) {
  const normalizedEmail = normalizeEmail(email)
  const snapshot = await db.collection(USERS_COLLECTION)
    .where('email', '==', normalizedEmail)
    .limit(1)
    .get()

  if (snapshot.empty) return null

  const doc = snapshot.docs[0]
  return normalizeUser({ id: doc.id, ...doc.data() })
}

export async function getUserById(userId) {
  const snapshot = await db.collection(USERS_COLLECTION).doc(userId).get()
  if (!snapshot.exists) return null
  return normalizeUser({ id: snapshot.id, ...snapshot.data() })
}

export function normalizeRole(role) {
  if (!role) return null
  const normalized = String(role).trim().toLowerCase()
  return ROLES.includes(normalized) ? normalized : null
}

export function normalizeUser(user) {
  const rol = normalizeRole(user.rol ?? user.role)
  return {
    id: user.id,
    usuarios_id: user.usuarios_id ?? user.id,
    nombre: user.nombre ?? '',
    apaterno: user.apaterno ?? '',
    amaterno: user.amaterno ?? '',
    email: normalizeEmail(user.email),
    rol,
    activo: user.activo !== false,
    passwordHash: user.passwordHash,
    perfilCompleto: user.perfilCompleto ?? true
  }
}

export function publicUser(user) {
  const { passwordHash, id, ...safeUser } = user
  return safeUser
}

export function signToken({ userId, rol }) {
  return jwt.sign({ sub: userId, usuarios_id: userId, rol }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  })
}
