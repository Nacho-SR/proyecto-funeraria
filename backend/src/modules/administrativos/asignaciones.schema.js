import { z } from 'zod'

export const createAsignacionCobroSchema = z.object({
  cobradorID: z.string(),
  clientes: z.array(z.object({
    clienteID: z.string(),
    contratoID: z.string(),
  }))
})