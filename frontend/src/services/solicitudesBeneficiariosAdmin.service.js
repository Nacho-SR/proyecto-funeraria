import api from './api'

const RESOURCE = '/administrativos/solicitudes-beneficiarios'

export const solicitudesBeneficiariosAdminService = {
  listar() {
    return api.get(RESOURCE)
  },

  resolver(id, payload) {
    return api.put(`${RESOURCE}/${id}/resolver`, payload)
  }
}
