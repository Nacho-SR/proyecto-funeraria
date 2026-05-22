import { z } from 'zod'

export const pagoSchema = z.object({
    contratos_id: z.string().min(1),
    monto: z.coerce.number().positive()
})

export const nuevoPagoSchema = pagoSchema

