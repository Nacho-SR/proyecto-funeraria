import api from './api'

// ── Cobrador ──────────────────────────────────────────────
export const cobradorService = {
  listar()              { return api.get('/cobradores') },
  obtener(id)           { return api.get(`/cobradores/${id}`) },
  crear(payload)        { return api.post('/cobradores', payload) },
  actualizar(id, data)  { return api.put(`/cobradores/${id}`, data) },
  /** Baja lógica: PATCH activo = false */
  darBaja(id)           { return api.patch(`/cobradores/${id}/baja`) },
}

// ── Contrato ──────────────────────────────────────────────
export const contratoService = {
  listar()              { return api.get('/contratos') },
  obtener(id)           { return api.get(`/contratos/${id}`) },
  crear(payload)        { return api.post('/contratos', payload) },
  actualizar(id, data)  { return api.put(`/contratos/${id}`, data) },
  darBaja(id)           { return api.patch(`/contratos/${id}/baja`) },
}

// ── Servicio (adicionales en Firestore) ──────────────────
export const servicioService = {
  listar()              { return api.get('/servicios') },
  obtener(id)           { return api.get(`/administrativos/servicios/${id}`) },
  actualizar(id, payload)  { return api.put(`/administrativos/servicios/${id}`, payload) },
  darBaja(id)           { return api.patch(`/servicios/${id}/baja`) },
}
