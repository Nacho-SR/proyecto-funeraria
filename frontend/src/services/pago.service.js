import api from './api'

const RESOURCE = '/administrativos'

export const pagoService = {
  listar() {
    return api.get(`${RESOURCE}/pagos`)
  },
  obtener(id) {
    return api.get(`${RESOURCE}/pagos/${id}`)
  },
  crear(payload) {
    return api.post(`${RESOURCE}/captura-pago`, payload)
  },
  validar(id, payload) {
    return api.put(`${RESOURCE}/validar-pago/${id}`, payload)
  },
  porContrato(contratoID) {
    return api.get(`${RESOURCE}/pagos/contrato/${contratoID}`)
  },
}