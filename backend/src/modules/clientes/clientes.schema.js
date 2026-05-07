import { z } from 'zod'

export const createClientesSchema = z.object({
  telefono: z.string().min(10),
  calle: z.string().min(3),
  colonia: z.string().min(3),
  numCasa: z.string().min(1),
  activo: z.boolean().optional().default(true)
})

export const updateClientesSchema = z.object({
  telefono: z.string().optional(),
  calle: z.string().optional(),
  colonia: z.string().optional(),
  numCasa: z.string().optional(),
  activo: z.boolean().optional()
}).strict()