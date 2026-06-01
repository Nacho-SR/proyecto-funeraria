import { ensureAdminUser } from '../src/modules/admin.js'

const ADMIN_EMAIL = 'admin@funeraria.com'
const ADMIN_PASSWORD = 'Admin123'

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error('Configura ADMIN_EMAIL y ADMIN_PASSWORD en este archivo local antes de ejecutarlo.')
  process.exit(1)
}

try {
  const result = await ensureAdminUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  })

  if (!result.created) {
    console.log(`El usuario admin ya existe: ${ADMIN_EMAIL}`)
    process.exit(0)
  }

  console.log(`Usuario admin creado: ${result.email}`)
  process.exit(0)
} catch (error) {
  console.error('No se pudo crear el usuario admin.')
  console.error(error)
  process.exit(1)
}
