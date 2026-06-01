import api from './api'

const RESOURCE = '/administrativos'

export const paqueteService = {
  async listar() {
    const res = await api.get(RESOURCE + '/productos-activos')
    const data = res.data?.productosActivos ?? res.data
    return { data: data?.paquetes ?? [] }
  },
  obtener(id) {
    return api.get(`${RESOURCE}/servicios/${id}`)
  },
  crear(payload) {
    return api.post(RESOURCE + '/alta-paquete-adicional', payload)
  },
  actualizar(id, payload) {
    return api.put(`${RESOURCE}/servicios/${id}`, payload)
  },
  eliminar(id) {
    return api.delete(`${RESOURCE}/servicios/${id}`)
  },
  listarAdicionales() {
    return api.get(RESOURCE + '/productos-activos')
  },
}
