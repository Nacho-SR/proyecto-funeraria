import * as yup from 'yup'

export const ROLES = ['admin', 'cobrador', 'administrativo']

export const usuarioModel = () => ({
  usuarioID: null,
  email: '',
  nombre: '',
  contrasena: '',
  rol: '',
  creadoPor: null,
  fechaDeCreacion: null,
})

export const usuarioSchema = yup.object({
  email: yup
    .string()
    .required('El email es obligatorio')
    .email('Email inválido')
    .max(100),
  nombre: yup
    .string()
    .required('El nombre es obligatorio')
    .max(100),
  contrasena: yup
    .string()
    .required('La contraseña es obligatoria')
    .min(8, 'Mínimo 8 caracteres')
    .matches(/[A-Z]/, 'Debe tener al menos una mayúscula')
    .matches(/[0-9]/, 'Debe tener al menos un número'),
  rol: yup
    .string()
    .required('El rol es obligatorio')
    .oneOf(ROLES, 'Rol inválido'),
})
