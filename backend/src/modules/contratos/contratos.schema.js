import {z} from 'zod'
import {createClientesSchema} from '../clientes/clientes.schema'
import {createBeneficiariosSchema} from '../beneficiarios/beneficiarios.schema'
import { usuariosSchema } from '../usuarios/usuarios.schema'

export const createContratosSchema = z.object({
  usuario: usuariosSchema,
  cliente: createClientesSchema,
  beneficiarios: {
    beneficiario1: createBeneficiariosSchema,
    beneficiario2: createBeneficiariosSchema.optional(),
    beneficiario3: createBeneficiariosSchema.optional()
  },
  fechaInicio: z.string().min(1),
  frecuenciaPago: z.string().min(1),
  estado: z.string().min(1)
})

export const updateContratosSchema = z.object({
  usuario: usuariosSchema.optional(),
  cliente: createClientesSchema.optional(),
  beneficiarios: {
    beneficiario1: createBeneficiariosSchema.optional(),
    beneficiario2: createBeneficiariosSchema.optional(),
    beneficiario3: createBeneficiariosSchema.optional()
  },
  fechaInicio: z.string().min(1).optional(),
  frecuenciaPago: z.string().min(1).optional(),
  estado: z.string().min(1).optional()
}).strict()