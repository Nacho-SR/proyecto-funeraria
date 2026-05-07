import * as yup from 'yup'

export const FRECUENCIAS_PAGO = ['semanal', 'quincenal', 'mensual']
export const ESTADOS_CONTRATO = ['activo', 'pagado', 'cancelado', 'suspendido']

export const contratoModel = () => ({
  contratoID: null,
  numContrato: '',
  id_cliente: null,
  id_paquete: null,
  fechaInicio: '',
  frecuenciaPago: 'mensual',
  diaPago: 1,
  precioTotal: 0,
  saldoActual: 0,
  estado: 'activo',
  creadoPor: null,
  fechaCreacion: null,
  actualizadoPor: null,
  fechaActualizacion: null,
})

export const contratoSchema = yup.object({
  numContrato: yup
    .string()
    .required('El número de contrato es obligatorio')
    .max(20, 'Máximo 20 caracteres'),
  id_cliente: yup
    .number()
    .typeError('Debe seleccionar un cliente')
    .required('El cliente es obligatorio')
    .integer()
    .positive(),
  id_paquete: yup
    .number()
    .typeError('Debe seleccionar un paquete')
    .required('El paquete es obligatorio')
    .integer()
    .positive(),
  fechaInicio: yup
    .date()
    .typeError('Fecha inválida')
    .required('La fecha de inicio es obligatoria'),
  frecuenciaPago: yup
    .string()
    .required('La frecuencia de pago es obligatoria')
    .oneOf(FRECUENCIAS_PAGO, 'Frecuencia inválida'),
  diaPago: yup
    .number()
    .required('El día de pago es obligatorio')
    .integer()
    .min(1, 'Día inválido')
    .max(31, 'Día inválido'),
  precioTotal: yup
    .number()
    .typeError('Debe ser un número')
    .required('El precio total es obligatorio')
    .positive('Debe ser mayor a 0'),
  estado: yup
    .string()
    .required('El estado es obligatorio')
    .oneOf(ESTADOS_CONTRATO, 'Estado inválido'),
})
