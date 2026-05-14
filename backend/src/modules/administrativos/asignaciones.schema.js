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
  direccion: z.string().min(4),
  nombre: z.string().min(3),
  telefono: z.string().min(7),
})

export const paqueteSchema = z.object({
  nombre: z.string().min(3),
  descripcion: z.string().min(10),
  precio_base: z.number().positive()
})

export const adicionalSchema = z.object({
  nombre: z.string().min(3),
  descripcion: z.string().min(10),
  precio: z.number().positive()
})

export const paqueteAdicionalSchema = z.object({
  paquete_id: z.string().min(3),
  adicional_id: z.string().min(3),
  precio_especial: z.number().min(0).max(100)
})

export const nuevoClienteSchema = z.object({
  usuario: usuarioSchema,
  cliente: clienteSchema
})

export const nuevoCobradorSchema = z.object({
  usuario: usuarioSchema,
  cobrador: cobradorSchema
})

export const createPaqueteAdicionalSchema = z.object({
  paquete: paqueteSchema.optional(),
  adicional: adicionalSchema.optional(),
  paqueteAdicional: paqueteAdicionalSchema.optional()
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