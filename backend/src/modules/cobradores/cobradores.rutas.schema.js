import { z } from 'zod'

export const registrarResultadoSchema = z.object({
  resultado: z.enum(['pagado', 'pospuesto', 'NE']),
  monto_recibido: z.coerce.number().nonnegative().optional().default(0)
})
