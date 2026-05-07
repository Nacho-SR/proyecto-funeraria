import * as yup from 'yup'

export const adicionalModel = () => ({
  adicionalesID: null,
  nombre: '',
  descripcion: '',
  precio: 0,
})

export const adicionalSchema = yup.object({
  nombre: yup
    .string()
    .required('El nombre es obligatorio')
    .max(100),
  descripcion: yup
    .string()
    .required('La descripción es obligatoria')
    .max(300),
  precio: yup
    .number()
    .typeError('El precio debe ser un número')
    .required('El precio es obligatorio')
    .min(0, 'No puede ser negativo'),
})
