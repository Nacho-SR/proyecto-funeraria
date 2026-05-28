import { nuevoPagoSchema } from '../pagos/pagos.schema.js';
import { ClientesService } from './clientes.service.js';
import { ApiError } from '../../shared/utils/apiError.js';
import { AdministrativosService } from '../administrativos/administrativos.service.js';
import { createBeneficiariosSchema } from '../beneficiarios/beneficiarios.schema.js'
import { updateBeneficiariosSchema } from '../beneficiarios/beneficiarios.schema.js'
import { crearSolicitudBeneficiarioSchema } from './solicitudesBeneficiarios.schema.js'

const serviceA = new AdministrativosService()
const service = new ClientesService()

export async function listarMisContratos (req, res) {
  const contratos = await service.listarContratosActivos(req.user.usuarios_id)
  res.status(200).json({ contratos })
}

export async function listarMisPagos (req, res) {
  const pagos = await service.listarMisPagos(req.user.usuarios_id)
  res.status(200).json({ pagos })
}

export async function listarMisBeneficiarios (req, res) {
  const beneficiarios = await service.listarMisBeneficiarios(req.user.usuarios_id)
  res.status(200).json({ beneficiarios })
}

export async function listarProductosActivos (req, res) {
  const productos = await service.listarProductosActivos()
  res.status(200).json({ productos })
}

export async function listarMisSolicitudesBeneficiarios (req, res) {
  const solicitudes = await service.listarMisSolicitudesBeneficiarios(req.user.usuarios_id)
  res.status(200).json({ solicitudes })
}

export async function crearSolicitudBeneficiario (req, res) {
  const payload = crearSolicitudBeneficiarioSchema.parse(req.body)
  const solicitud = await service.crearSolicitudBeneficiario(req.user.usuarios_id, payload)
  res.status(201).json({ solicitud })
}

export async function altaBeneficiario (req, res) {
  const { error, value } = createBeneficiariosSchema.safeParse(req.body)
  if (error) {
    throw new ApiError(400, 'Datos de beneficiario inválidos', error.errors)
  }
}

export async function actualizarBeneficiario (req, res) {
  const { error, value } = updateBeneficiariosSchema.safeParse(req.body)
  if (error) {
    throw new ApiError(400, 'Datos de beneficiario inválidos', error.errors)
  }
}

export const crearEnlacePago = async (req, res) => {
  const { contratoID, clienteID, monto, correoCliente } = req.body
  if (!contratoID || !monto || !correoCliente) {
        return res.status(400).json({ error: "Faltan datos obligatorios para generar el cobro" });
    }
  const resultado = await service.generarEnlaceDePago({
        contratoID,
        clienteID,
        monto,
        correoCliente
    })
  res.status(200).json({
        mensaje: "Enlace de pago generado con éxito",
        url: resultado.urlPago
    })
}