import api from './api'

const RESOURCE = '/contratos'

export const contratoService = {
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
  darBaja(id) {
    return api.patch(`${RESOURCE}/${id}/baja`)
  },
}