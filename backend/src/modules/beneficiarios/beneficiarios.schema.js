import {z} from 'zod'

export const createBeneficiariosSchema = z.object({
  nombre: z.string().min(1),
  apaterno: z.string().min(1),
  amaterno: z.string().optional(),
  parentesco: z.string().min(1),
  telefono: z.string().min(10),
  direccion: z.string().min(1)
})

export const updateBeneficiariosSchema = z.object({
  nombre: z.string().optional(),
  apaterno: z.string().optional(),
  amaterno: z.string().optional(),
  parentesco: z.string().min(1).optional(),
  telefono: z.string().min(10).optional(),
  direccion: z.string().min(1).optional()
}).strict()