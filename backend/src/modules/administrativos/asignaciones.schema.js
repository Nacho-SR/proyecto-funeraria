import { z } from 'zod'

export const usuarioSchema = z.object({
  nombre: z.string().min(3),
  apaterno: z.string().min(3),
  amaterno: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
})

export const clienteSchema = z.object({
  telefono: z.string().min(7),
  calle: z.string().min(3),
  colonia: z.string().min(3),
  num_casa: z.string().min(1)
})

export const cobradorSchema = z.object({
  direccion: z.string.min(4),
  nombre: z.string.min(3),
  telefono: z.string.min(7),
})

export const nuevoClienteSchema = z.object({
  usuario: usuarioSchema,
  cliente: clienteSchema
})

export const editarClienteSchema = z.object({
  usuario: usuarioSchema,
  cliente: clienteSchema
})

export const nuevoCobradorSchema = z.object({
  usuario: usuarioSchema,
  cobrador: cobradorSchema
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