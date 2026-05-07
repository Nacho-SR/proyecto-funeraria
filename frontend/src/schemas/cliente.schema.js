import * as yup from 'yup'

// Modelo vacío (estructura inicial para forms)
export const clienteModel = () => ({
  clienteID: null,
  nombre: '',
  apaterno: '',
  amaterno: '',
  telefono: '',
  email: '',
  calle: '',
  colonia: '',
  numCasa: '',
  usuarioID: null,
  // metadatos (los llena el backend, pero los listamos por completitud)
  creadoPor: null,
  fechaCreacion: null,
  actualizadoPor: null,
  fechaActualizacion: null,
})

// Schema de validación con Yup
export const clienteSchema = yup.object({
  nombre: yup
    .string()
    .required('El nombre es obligatorio')
    .min(2, 'Mínimo 2 caracteres')
    .max(50, 'Máximo 50 caracteres'),
  apaterno: yup
    .string()
    .required('El apellido paterno es obligatorio')
    .max(50, 'Máximo 50 caracteres'),
  amaterno: yup
    .string()
    .max(50, 'Máximo 50 caracteres')
    .nullable(),
  telefono: yup
    .string()
    .required('El teléfono es obligatorio')
    .matches(/^[0-9]{10}$/, 'Debe ser un teléfono de 10 dígitos'),
  email: yup
    .string()
    .email('Email inválido')
    .nullable(),
  calle: yup
    .string()
    .required('La calle es obligatoria')
    .max(100, 'Máximo 100 caracteres'),
  colonia: yup
    .string()
    .required('La colonia es obligatoria')
    .max(100, 'Máximo 100 caracteres'),
  numCasa: yup
    .string()
    .required('El número de casa es obligatorio')
    .max(10, 'Máximo 10 caracteres'),
})
