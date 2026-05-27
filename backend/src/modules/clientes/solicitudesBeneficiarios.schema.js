import { z } from 'zod'

const beneficiarioPropuestoSchema = z.object({
  nombre: z.string().trim().min(1),
  apaterno: z.string().trim().optional().default(''),
  amaterno: z.string().trim().optional().default(''),
  parentesco: z.string().trim().min(1),
  telefono: z.string().trim().optional().default(''),
  direccion: z.string().trim().optional().default('')
})

export const crearSolicitudBeneficiarioSchema = z.object({
  tipo: z.enum(['crear', 'actualizar', 'eliminar']),
  contratos_id: z.string().trim().min(1),
  beneficiario_id: z.string().trim().min(1).optional(),
  datos_propuestos: beneficiarioPropuestoSchema.optional(),
  motivo_cliente: z.string().trim().max(500).optional().default('')
}).superRefine((data, ctx) => {
  if (['actualizar', 'eliminar'].includes(data.tipo) && !data.beneficiario_id) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['beneficiario_id'],
      message: 'El beneficiario es requerido para actualizar o eliminar'
    })
  }

  if (['crear', 'actualizar'].includes(data.tipo) && !data.datos_propuestos) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['datos_propuestos'],
      message: 'Los datos propuestos son requeridos'
    })
  }
})
