import * as yup from 'yup'

export const pagoModel = () => ({
  pagoID: null,
  contratoID: null,
  monto: 0,
  creadoPor: null,
  fechaCreacion: null,
})

export const pagoSchema = yup.object({
  contratoID: yup
    .string()
    .typeError('Debe seleccionar un contrato')
    .required('El contrato es obligatorio')
    .min(1, 'Debe seleccionar un contrato'),
  monto: yup
    .number()
    .typeError('El monto debe ser un numero')
    .required('El monto es obligatorio')
    .positive('Debe ser mayor a 0'),
})
