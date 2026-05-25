import { db, admin } from '../config/firebase.js'
import { hashPassword, normalizeEmail, USERS_COLLECTION } from './auth.js'

export async function ensureAdminUser({ email, password }) {
  const normalizedEmail = normalizeEmail(email)
  const userSnapshot = await db.collection(USERS_COLLECTION)
    .where('email', '==', normalizedEmail)
    .limit(1)
    .get()

  if (!userSnapshot.empty) {
    return { created: false, reason: 'already_exists' }
  }

  const userRef = db.collection(USERS_COLLECTION).doc()
  const passwordHash = await hashPassword(password)

  await userRef.set({
    email: normalizedEmail,
    rol: 'admin',
    activo: true,
    passwordHash,
    fecha_creacion: admin.firestore.FieldValue.serverTimestamp(),
    fecha_modificacion: admin.firestore.FieldValue.serverTimestamp(),
  })

  return { created: true, email: normalizedEmail }
}
