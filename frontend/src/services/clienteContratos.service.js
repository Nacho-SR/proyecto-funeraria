import api from './api'

const RESOURCE = '/clientes'

export const clienteContratosService = {
  listarMisContratos() {
    return api.get(`${RESOURCE}/mis-contratos`)
  },

  listarMisPagos() {
    return api.get(`${RESOURCE}/mis-pagos`)
  },

  listarMisBeneficiarios() {
    return api.get(`${RESOURCE}/mis-beneficiarios`)
  }
}
