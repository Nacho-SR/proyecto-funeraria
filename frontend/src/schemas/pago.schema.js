import * as yup from 'yup'

export const ESTATUS_PAGO = ['pendiente', 'pagado', 'vencido', 'cancelado']

export const pagoModel = () => ({
  pagoID: null,
  contratoID: null,
  fechaPago: '',
  monto: 0,
  estatus: 'pendiente',
  creadoPor: null,
  fechaCreacion: null,
})

export const pagoSchema = yup.object({
  contratoID: yup
    .number()
    .typeError('Debe seleccionar un contrato')
    .required('El contrato es obligatorio')
    .integer()
    .positive(),
  fechaPago: yup
    .date()
    .typeError('Fecha inválida')
    .required('La fecha de pago es obligatoria'),
  monto: yup
    .number()
    .typeError('El monto debe ser un número')
    .required('El monto es obligatorio')
    .positive('Debe ser mayor a 0'),
  estatus: yup
    .string()
    .required('El estatus es obligatorio')
    .oneOf(ESTATUS_PAGO, 'Estatus inválido'),
})
