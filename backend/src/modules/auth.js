import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { db } from '../config/firebase.js'
import { env } from '../config/env.js'

export const USERS_COLLECTION = 'users'
const PASSWORD_SALT_ROUNDS = 10

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
  const snapshot = await db.collection(USERS_COLLECTION).doc(normalizedEmail).get()

  if (!snapshot.exists) return null

  return { id: snapshot.id, ...snapshot.data() }
}

export function signToken({ userId, role }) {
  return jwt.sign({ sub: userId, role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  })
}