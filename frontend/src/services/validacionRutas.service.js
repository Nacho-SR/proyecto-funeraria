import api from './api'

const RESOURCE = '/administrativos/rutas-cobro'

export const validacionRutasService = {
  listar() {
    return api.get('/administrativos/rutas-cobro-validacion')
  },
  obtener(rutaId) {
    return api.get(`${RESOURCE}/${rutaId}/validacion`)
  },
  revisarVisita(rutaId, detalleId, payload = {}) {
    return api.put(`${RESOURCE}/${rutaId}/visitas/${detalleId}/revisar`, payload)
  },
  terminar(rutaId) {
    return api.post(`${RESOURCE}/${rutaId}/terminar-validacion`)
  }
}
