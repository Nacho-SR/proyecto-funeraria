import * as yup from 'yup'

export const beneficiarioModel = () => ({
  beneficiarioID: null,
  contratoID: null,
  nombre: '',
  apaterno: '',
  amaterno: '',
  parentesco: '',
  telefono: '',
  direccion: '',
})

export const beneficiarioSchema = yup.object({
  contratoID: yup
    .number()
    .typeError('Contrato inválido')
    .required('El contrato es obligatorio')
    .integer()
    .positive(),
  nombre: yup
    .string()
    .required('El nombre es obligatorio')
    .max(50),
  apaterno: yup
    .string()
    .required('El apellido paterno es obligatorio')
    .max(50),
  amaterno: yup.string().max(50).nullable(),
  parentesco: yup
    .string()
    .required('El parentesco es obligatorio')
    .max(30),
  telefono: yup
    .string()
    .required('El teléfono es obligatorio')
    .matches(/^[0-9]{10}$/, 'Debe ser un teléfono de 10 dígitos'),
  direccion: yup
    .string()
    .required('La dirección es obligatoria')
    .max(200),
})
