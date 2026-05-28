import { ApiError } from '../../shared/utils/apiError.js'
import { ClientesRepository } from './clientes.repo.js'
import { FieldValue } from 'firebase-admin/firestore'
import bcrypt from 'bcrypt'
import { admin } from '../../config/firebase.js'
import Stripe from 'stripe'
import { env } from '../../config/env.js'

export class ClientesService {
    constructor () {
        this.repo = new ClientesRepository()
    }

  async listarContratosActivos(usuarioId) {
    const cliente = await this.repo.findClienteByUsuarioId(usuarioId)
    if (!cliente) {
      throw new ApiError(404, 'No se encontro el perfil de cliente asociado al usuario')
    }

    const contratos = await this.repo.listarContratosPorCliente(cliente.clientes_id)
    return contratos.filter(contrato =>
      contrato.activo !== false &&
      (contrato.estado ?? 'activo') === 'activo'
    )
  }

  async listarMisPagos(usuarioId) {
    const cliente = await this.repo.findClienteByUsuarioId(usuarioId)
    if (!cliente) {
      throw new ApiError(404, 'No se encontro el perfil de cliente asociado al usuario')
    }

    return await this.repo.listarPagosPorCliente(cliente.clientes_id)
  }

  async listarMisBeneficiarios(usuarioId) {
    const cliente = await this.repo.findClienteByUsuarioId(usuarioId)
    if (!cliente) {
      throw new ApiError(404, 'No se encontro el perfil de cliente asociado al usuario')
    }

    const contratos = await this.repo.listarContratosPorCliente(cliente.clientes_id)
    const contratosActivos = contratos.filter(contrato =>
      contrato.activo !== false &&
      (contrato.estado ?? 'activo') === 'activo'
    )

    return this.repo.listarBeneficiariosPorContratos(contratosActivos)
  }

  async listarProductosActivos() {
    return await this.repo.listarProductosActivos()
  }

  async listarMisSolicitudesBeneficiarios(usuarioId) {
    const cliente = await this.repo.findClienteByUsuarioId(usuarioId)
    if (!cliente) {
      throw new ApiError(404, 'No se encontro el perfil de cliente asociado al usuario')
    }

    return await this.repo.listarSolicitudesBeneficiariosByCliente(cliente.clientes_id)
  }

  async crearSolicitudBeneficiario(usuarioId, data) {
    const cliente = await this.repo.findClienteByUsuarioId(usuarioId)
    if (!cliente) {
      throw new ApiError(404, 'No se encontro el perfil de cliente asociado al usuario')
    }

    const contrato = await this.repo.findContratoById(data.contratos_id)
    if (!contrato || contrato.clientes_id !== cliente.clientes_id) {
      throw new ApiError(404, 'Contrato no encontrado')
    }
    if (contrato.activo === false || (contrato.estado ?? 'activo') !== 'activo') {
      throw new ApiError(409, 'Solo se pueden solicitar cambios en contratos activos')
    }

    let beneficiario = null
    if (data.beneficiario_id) {
      beneficiario = await this.repo.findBeneficiarioById(data.beneficiario_id)
      if (!beneficiario || !this.beneficiarioPerteneceAContrato(beneficiario, contrato.contratos_id)) {
        throw new ApiError(404, 'Beneficiario no encontrado')
      }
      if (beneficiario.activo === false) {
        throw new ApiError(409, 'El beneficiario ya esta inactivo')
      }

      const pendiente = await this.repo.findSolicitudPendienteBeneficiario({
        clienteId: cliente.clientes_id,
        contratoId: contrato.contratos_id,
        beneficiarioId: beneficiario.beneficiario_id
      })
      if (pendiente) {
        throw new ApiError(409, 'Ya existe una solicitud pendiente para este beneficiario')
      }
    }

    const solicitud = {
      cliente_id: cliente.clientes_id,
      usuarios_id: usuarioId,
      contratos_id: contrato.contratos_id,
      num_contrato: contrato.num_contrato ?? null,
      beneficiario_id: beneficiario?.beneficiario_id ?? null,
      tipo: data.tipo,
      estado: 'pendiente',
      datos_actuales: beneficiario ? this.snapshotBeneficiario(beneficiario) : null,
      datos_propuestos: data.tipo === 'eliminar' ? null : data.datos_propuestos,
      motivo_cliente: data.motivo_cliente ?? '',
      creado_por: usuarioId,
      fecha_creacion: admin.firestore.FieldValue.serverTimestamp(),
      fecha_modificacion: admin.firestore.FieldValue.serverTimestamp()
    }

    return await this.repo.crearSolicitudBeneficiario(solicitud)
  }

  beneficiarioPerteneceAContrato(beneficiario, contratoId) {
    return (beneficiario.contrato_id ?? beneficiario.contratos_id) === contratoId
  }

  snapshotBeneficiario(beneficiario) {
    return {
      nombre: beneficiario.nombre ?? '',
      apaterno: beneficiario.apaterno ?? '',
      amaterno: beneficiario.amaterno ?? '',
      parentesco: beneficiario.parentesco ?? '',
      telefono: beneficiario.telefono ?? '',
      direccion: beneficiario.direccion ?? ''
    }
  }

  async crearNuevoBeneficiario(data) {
    console.log('Creando nuevo beneficiario con data:', data)
    console.log('Validando si el beneficiario ya existe con nombre:', data.beneficiario.nombre)
    if (await this.repo.findUserByEmail(data.beneficiario.nombre)) {
      throw new ApiError(409, 'El beneficiario ya existe')
    }

    const beneficiario = {
      ...data.beneficiario,
      fecha_creacion: beneficiarios.firestore.FieldValue.serverTimestamp(),
      fecha_modificacion: beneficiarios.firestore.FieldValue.serverTimestamp()
    }

    const nuevoBeneficiario = await this.repo.crearNuevoBeneficiario(beneficiario)
    return { nuevoBeneficiario }
  }

  async generarEnlaceDePago(datosPago) {
    console.log('Generando enlace de Stripe para contrato:', datosPago.contratoID)

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

    const montoEnCentavos = Math.round(datosPago.monto * 100)

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
            line_items: [
              {
                price_data: {
                        currency: 'mxn', // Moneda en pesos mexicanos
                        product_data: {
                            name: `Pago de Contrato Funerario: ${datosPago.contratoID}`,
                            description: `Cliente ID: ${datosPago.clienteID}`,
                        },
                        unit_amount: montoEnCentavos,
                    },
                    quantity: 1,
              },
            ],

            mode: 'payment',
            customer_email: datosPago.correoCliente,
            success_url: 'http://localhost:3000/pago-exitoso?session_id={CHECKOUT_SESSION_ID}',
            cancel_url: 'http://localhost:3000/pago-cancelado',

            metadata: {
                contratoID: datosPago.contratoID,
                clienteID: datosPago.clienteID
            }
    })

    return { 
            urlPago: session.url,
            sessionID: session.id 
        }
  }
}
