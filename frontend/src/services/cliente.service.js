import api from './api'

const RESOURCE = '/administrativos'

export const clienteService = {
  listar() {
    return api.get(RESOURCE+'/clientes-activos')
  },
  obtener(id) {
    return api.get(`${RESOURCE}/clientes/${id}`)
  },
  crear(payload) {
    return api.post(RESOURCE+'/alta-cliente', payload)
  },
  actualizar(id, payload) {
    return api.put(`/clientes/${id}`, payload)
  },
  eliminar(id) {
    return api.delete(`/clientes/${id}`)
  },
}