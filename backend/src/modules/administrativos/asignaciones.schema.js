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
  precio_especial: z.number().positive()
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
  paquete_id: z.string().min(3).optional(),
  paquete: paqueteSchema.optional(),
  adicional_id: z.string().min(3).optional(),
  adicional: adicionalSchema.optional(),
  promo: z.boolean().default(false).optional(),
  precio_especial: z.number().positive().optional()
})

export const createContratoSchema = z.object({
  cliente_id: z.string().optional(),
  nuevo_cliente: nuevoClienteSchema.optional(),
  paquete_id: z.string(),
  fecha_inicio: z.string().refine(val => !isNaN(Date.parse(val)), { message: 'Fecha inválida' }),
  frecuencia_pago: z.enum(['semanal', 'quincenal', 'mensual']),
})

export const updateContratoSchema = z.object({
  cliente_id: z.string().optional(),
  paquete_id: z.string().optional(),
  fecha_inicio: z.string().refine(val => !isNaN(Date.parse(val)), { message: 'Fecha inválida' }).optional(),
  frecuencia_pago: z.enum(['semanal', 'quincenal', 'mensual']).optional(),
}).strict()

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