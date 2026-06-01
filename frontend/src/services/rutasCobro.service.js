import api from './api'

const RESOURCE = '/cobrador/rutas-cobro'

export const rutasCobroService = {
  listar() {
    return api.get(RESOURCE)
  },
  obtener(id) {
    return api.get(`${RESOURCE}/${id}`)
  },
  iniciar(id) {
    return api.patch(`${RESOURCE}/${id}/iniciar`)
  },
  registrarResultado(rutaId, detalleId, payload) {
    return api.post(`${RESOURCE}/${rutaId}/detalles/${detalleId}/resultado`, payload)
  }
}
