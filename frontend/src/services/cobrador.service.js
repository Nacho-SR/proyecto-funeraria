import api from './api'

const RESOURCE = '/cobradores'

export const cobradorService = {
  listar() {
    return api.get(RESOURCE)
  },
  obtener(id) {
    return api.get(`${RESOURCE}/${id}`)
  },
  crear(payload) {
    return api.post(RESOURCE, payload)
  },
  actualizar(id, payload) {
    return api.put(`${RESOURCE}/${id}`, payload)
  },
  eliminar(id) {
    return api.delete(`${RESOURCE}/${id}`)
  },
}