import * as yup from 'yup'

export const cobradorModel = () => ({
  cobradorID: null,
  nombre: '',
  direccion: '',
  telefono: '',
  usuarioID: null,
})

export const cobradorSchema = yup.object({
  nombre: yup
    .string()
    .required('El nombre es obligatorio')
    .max(100, 'Máximo 100 caracteres'),
  direccion: yup
    .string()
    .required('La dirección es obligatoria')
    .max(200, 'Máximo 200 caracteres'),
  telefono: yup
    .string()
    .required('El teléfono es obligatorio')
    .matches(/^[0-9]{10}$/, 'Debe ser un teléfono de 10 dígitos'),
  usuarioID: yup
    .number()
    .nullable(),
})
