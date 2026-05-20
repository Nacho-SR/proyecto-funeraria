import { z } from 'zod'
import { createClientesSchema } from '../clientes/clientes.schema.js'

export const pagoSchema = z.object({
    contratoID: z.string().min(1),
    creadoPor: z.string().min(1),
    estatus: z.string().min(3),
    fechaPago: z.string(),
    monto: z.number().positive()
})

export const nuevoPagoSchema = z.object({
    clientes: createClientesSchema,
    pagos: pagoSchema
})

