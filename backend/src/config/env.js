import 'dotenv/config'

export const env = {
  PORT: process.env.PORT,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN,
  FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
  FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
  FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
  CORS_ORIGIN: process.env.CORS_ORIGIN || '*'
}

const required = [
  'PORT', 'JWT_SECRET', 'JWT_EXPIRES_IN', 'FIREBASE_PROJECT_ID',
  'FIREBASE_CLIENT_EMAIL', 'FIREBASE_PRIVATE_KEY', 'CORS_ORIGIN'
]

for (const key of required) {
  if (!env[key]) {
    throw new Error(`Missing env var: ${key}`)
  }
}