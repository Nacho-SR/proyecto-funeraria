import api from './api'

const RESOURCE = '/clientes'

export const clienteContratosService = {
  listarMisContratos() {
    return api.get(`${RESOURCE}/mis-contratos`)
  }
}
