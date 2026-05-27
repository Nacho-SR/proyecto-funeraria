import api from './api'

const RESOURCE = '/cobradores'
const ADMIN_RESOURCE = '/administrativos/cobradores'

export const cobradorService = {
  listar() {
    return api.get(RESOURCE)
  },
  obtener(id) {
    return api.get(`${ADMIN_RESOURCE}/${id}`)
  },
  crear(payload) {
    return api.post(RESOURCE, payload)
  },
  actualizar(id, payload) {
    return api.put(`${ADMIN_RESOURCE}/${id}`, payload)
  },
  eliminar(id) {
    return api.patch(`/cobradores/${id}/baja`)
  },
}