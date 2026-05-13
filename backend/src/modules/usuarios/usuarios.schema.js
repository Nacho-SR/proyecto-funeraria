import { z } from 'zod'

export const createUsuarioSchema = z.object({
  uid: z.string(), // Firebase UID
  nombre: z.string().min(3),
  apaterno: z.string().min(1),
  amaterno: z.string().optional(),
  email: z.string().email(),
  passwordHash: z.string().min(6),
  rol: z.enum(['ADMIN', 'COBRADOR', 'CLIENTE']),
  referenciaID: z.string().optional(),
  activo: z.boolean().optional().default(true)
})

export const updateUsuarioSchema = z.object({
  nombre: z.string().optional(),
  apaterno: z.string().optional(),
  amaterno: z.string().optional(),
  email: z.string().email().optional(),
  passwordHash: z.string().min(6).optional(),
  rol: z.enum(['ADMIN', 'COBRADOR', 'CLIENTE']).optional(),
  activo: z.boolean().optional()
}).strict()