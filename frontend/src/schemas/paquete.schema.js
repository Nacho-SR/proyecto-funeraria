import * as yup from 'yup'

/**
 * Los paquetes son lo que se vende al cliente (con o sin adicionales).
 * Un paquete puede incluir N adicionales (relación paquete_adicionales).
 */

// Modelo vacío
export const paqueteModel = () => ({
  paqueteID: null,
  nombre: '',
  descripcion: '',
  precioBase: 0,
  // adicionales seleccionados (array de adicionalID)
  adicionales: [],
})

// Schema de validación
export const paqueteSchema = yup.object({
  nombre: yup
    .string()
    .required('El nombre del paquete es obligatorio')
    .min(3, 'Mínimo 3 caracteres')
    .max(100, 'Máximo 100 caracteres'),
  descripcion: yup
    .string()
    .required('La descripción es obligatoria')
    .min(10, 'Mínimo 10 caracteres')
    .max(500, 'Máximo 500 caracteres'),
  precioBase: yup
    .number()
    .typeError('El precio debe ser un número')
    .required('El precio base es obligatorio')
    .positive('El precio debe ser mayor a 0')
    .max(9999999, 'Precio demasiado alto'),
  adicionales: yup
    .array()
    .of(yup.number().integer())
    .nullable(),
})
