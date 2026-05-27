import api from './api'

const RESOURCE = '/clientes'

export const clienteProductosService = {
  listarActivos() {
    return api.get(`${RESOURCE}/productos-activos`)
  }
}
