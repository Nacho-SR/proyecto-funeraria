import api from './api'

const RESOURCE = '/administrativos'

export const rutaCobroAdminService = {
  listarContratos() {
    return api.get(`${RESOURCE}/info-contratos`)
  },
  listarCobradores() {
    return api.get(`${RESOURCE}/cobradores-activos`)
  },
  crear(payload) {
    return api.post(`${RESOURCE}/nueva-ruta-cobro`, payload)
  }
}
