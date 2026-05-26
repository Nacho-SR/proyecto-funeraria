import { ApiError } from '../../shared/utils/apiError.js'
import { CobradoresRepository } from './cobradores.repository.js'

export class CobradoresService {
  constructor() {
    this.repo = new CobradoresRepository()
  }

  async obtenerCobradorActivo(usuariosId) {
    const cobrador = await this.repo.findCobradorByUsuarioId(usuariosId)
    if (!cobrador || cobrador.activo === false) {
      throw new ApiError(404, 'Cobrador no encontrado o inactivo')
    }
    return cobrador
  }

  async listarRutasCobro(usuariosId) {
    const cobrador = await this.obtenerCobradorActivo(usuariosId)
    return this.repo.listarRutasPorCobrador(cobrador.cobradores_id)
  }

  async obtenerRutaCobro(usuariosId, rutaId) {
    const cobrador = await this.obtenerCobradorActivo(usuariosId)
    return this.repo.obtenerRutaConDetalles(cobrador.cobradores_id, rutaId)
  }

  async iniciarRutaCobro(usuariosId, rutaId) {
    const cobrador = await this.obtenerCobradorActivo(usuariosId)
    return this.repo.iniciarRuta(cobrador.cobradores_id, rutaId, usuariosId)
  }

  async registrarResultado({ usuariosId, rutaId, detalleId, payload }) {
    const cobrador = await this.obtenerCobradorActivo(usuariosId)
    const resultado = payload.resultado
    const montoRecibido = resultado === 'pagado'
      ? Number(payload.monto_recibido)
      : 0

    if (resultado === 'pagado' && (!Number.isFinite(montoRecibido) || montoRecibido <= 0)) {
      throw new ApiError(400, 'El monto recibido debe ser mayor a cero cuando el resultado es pagado')
    }

    return this.repo.registrarResultado({
      cobradorId: cobrador.cobradores_id,
      usuariosId,
      rutaId,
      detalleId,
      resultado,
      montoRecibido
    })
  }
}
