import { z } from 'zod'

export const createUsuarioSchema = z.object({
  nombre: z.string().min(3),
  apaterno: z.string().min(3),
  amaterno: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
  rol: z.enum(['cliente', 'cobrador']),
  activo: z.boolean().default(true),
  creado_por: z.string().optional(),
  fecha_creacion: z.date().default(() => new Date()),
  modificado_por: z.string().optional(),
  fecha_modificacion: z.date().optional()
})

export const createAsignacionCobroSchema = z.object({
  cobradorID: z.string(),
  clientes: z.array(z.object({
    clienteID: z.string(),
    contratoID: z.string(),
  }))
})

export const updateAsignacionCobroSchema = z.object({
  cobradorID: z.string().optional(),
  clientes: z.array(z.object({
    clienteID: z.string(),
    contratoID: z.string(),
  })).optional()
}).strict()