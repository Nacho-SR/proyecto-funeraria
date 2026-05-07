import { z } from 'zod'

export const createCobradoresSchema = z.object({
  direccion: z.string().min(5),
  telefono: z.string().min(10),
  usuarioID: z.string(),
  activo: z.boolean().optional().default(true)
})

export const updateCobradoresSchema = z.object({
  direccion: z.string().optional(),
  telefono: z.string().optional(),
  activo: z.boolean().optional()
}).strict()