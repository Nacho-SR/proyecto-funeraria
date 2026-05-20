import { z } from 'zod'
import clienteSchema from 'backend/src/modules/administrativos'

export const pagoSchema = ({
    contratoID: z.string().min(1),
    creadoPor: z.string().min(1),
    estatus: z.string().min(3),
    fechaCreacion: z.date().safeParse(new Date()),
    fechaPago: z.date(),
    monto: z.number().positive()
})

export const nuevoPagoSchema = z.object({
    clientes: clienteSchema,
    pagos: pagoSchema
})

