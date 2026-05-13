import api from './api'

const RESOURCE = '/administrativos/alta-cliente'

export const clienteService = {
  listar() {
    return api.get('/clientes')
  },
  obtener(id) {
    return api.get(`/clientes/${id}`)
  },
  crear(payload) {
    return api.post(RESOURCE, payload)
  },
  actualizar(id, payload) {
    return api.put(`/clientes/${id}`, payload)
  },
  eliminar(id) {
    return api.delete(`/clientes/${id}`)
  },
}