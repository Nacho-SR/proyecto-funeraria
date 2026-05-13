import api from './api'

const RESOURCE = '/paquetes'

export const paqueteService = {
  listar() {
    return api.get(RESOURCE)
  },
  obtener(id) {
    return api.get(`${RESOURCE}/${id}`)
  },
  crear(payload) {
    // payload incluye { nombre, descripcion, precioBase, adicionales: [ids] }
    return api.post(RESOURCE, payload)
  },
  actualizar(id, payload) {
    return api.put(`${RESOURCE}/${id}`, payload)
  },
  eliminar(id) {
    return api.delete(`${RESOURCE}/${id}`)
  },
  // Para llenar el selector de adicionales en el form
  listarAdicionales() {
    return api.get('/adicionales')
  },
}
