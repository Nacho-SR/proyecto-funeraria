import { db } from '../../config/firebase.js'

export class ClientesRepository {
  async findClienteByUsuarioId(usuarioId) {
    const cliente = await db.collection('clientes')
      .where('usuarios_id', '==', usuarioId)
      .limit(1)
      .get()

    if (cliente.empty) return null
    return { clientes_id: cliente.docs[0].id, ...cliente.docs[0].data() }
  }

  async listarContratosPorCliente(clienteId) {
    const contratos = await db.collection('contratos')
      .where('clientes_id', '==', clienteId)
      .get()

    if (contratos.empty) return []

    const resultado = await Promise.all(
      contratos.docs.map(async doc => this.enriquecerContrato({ contratos_id: doc.id, ...doc.data() }))
    )

    return resultado.sort((a, b) => this.fechaMillis(b.fecha_inicio) - this.fechaMillis(a.fecha_inicio))
  }

  async enriquecerContrato(contrato) {
    const [
      paquete,
      direccionCobro,
      beneficiarios,
      adicionales,
      resumenPagos
    ] = await Promise.all([
      contrato.paquetes_id ? this.findPaqueteById(contrato.paquetes_id) : null,
      this.findDireccionCobroByContratoId(contrato.contratos_id),
      this.listarBeneficiariosByContratoId(contrato.contratos_id),
      this.listarAdicionalesByContratoId(contrato.contratos_id),
      this.resumenPagosByContratoId(contrato.contratos_id)
    ])

    return {
      ...contrato,
      paquete,
      direccion_cobro: direccionCobro,
      beneficiarios,
      adicionales,
      resumen_pagos: resumenPagos
    }
  }

  async findPaqueteById(paqueteId) {
    const paqueteDoc = await db.collection('paquetes').doc(paqueteId).get()
    if (!paqueteDoc.exists) return null
    return { paquetes_id: paqueteDoc.id, ...paqueteDoc.data() }
  }

  async findAdicionalById(adicionalId) {
    const adicionalDoc = await db.collection('adicionales').doc(adicionalId).get()
    if (!adicionalDoc.exists) return null
    return { adicionales_id: adicionalDoc.id, ...adicionalDoc.data() }
  }

  async findDireccionCobroByContratoId(contratoId) {
    const porContratoId = await db.collection('direcciones_cobro')
      .where('contrato_id', '==', contratoId)
      .limit(1)
      .get()

    if (!porContratoId.empty) {
      return { direcciones_cobro_id: porContratoId.docs[0].id, ...porContratoId.docs[0].data() }
    }

    const porContratosId = await db.collection('direcciones_cobro')
      .where('contratos_id', '==', contratoId)
      .limit(1)
      .get()

    if (porContratosId.empty) return null
    return { direcciones_cobro_id: porContratosId.docs[0].id, ...porContratosId.docs[0].data() }
  }

  async listarBeneficiariosByContratoId(contratoId) {
    const snaps = await this.buscarPorContratoId('beneficiarios', contratoId)
    return snaps.map(doc => ({ beneficiario_id: doc.id, ...doc.data() }))
  }

  async listarAdicionalesByContratoId(contratoId) {
    const snaps = await this.buscarPorContratoId('contrato_adicionales', contratoId)

    return await Promise.all(snaps.map(async doc => {
      const contratoAdicional = { contrato_adicionales_id: doc.id, ...doc.data() }
      const adicionalId = contratoAdicional.adicional_id ?? contratoAdicional.adicionales_id
      const adicional = adicionalId ? await this.findAdicionalById(adicionalId) : null

      return {
        ...contratoAdicional,
        adicional
      }
    }))
  }

  async resumenPagosByContratoId(contratoId) {
    const snaps = await this.buscarPorContratoId('pagos', contratoId)
    const pagos = snaps.map(doc => ({ pagos_id: doc.id, ...doc.data() }))
    const porValidar = pagos.filter(pago => (pago.estatus ?? pago.estado) === 'por validar')

    return {
      total_registrados: pagos.length,
      por_validar: porValidar.length,
      monto_por_validar: porValidar.reduce((total, pago) => total + Number(pago.monto ?? 0), 0)
    }
  }

  async buscarPorContratoId(collectionName, contratoId) {
    const [porContratoId, porContratosId] = await Promise.all([
      db.collection(collectionName).where('contrato_id', '==', contratoId).get(),
      db.collection(collectionName).where('contratos_id', '==', contratoId).get()
    ])

    const docs = new Map()
    porContratoId.docs.forEach(doc => docs.set(doc.id, doc))
    porContratosId.docs.forEach(doc => docs.set(doc.id, doc))
    return [...docs.values()]
  }

  fechaMillis(fecha) {
    if (!fecha) return 0
    if (typeof fecha.toDate === 'function') return fecha.toDate().getTime()
    if (fecha.seconds || fecha._seconds) return new Date((fecha.seconds ?? fecha._seconds) * 1000).getTime()
    const parsed = new Date(fecha)
    return Number.isNaN(parsed.getTime()) ? 0 : parsed.getTime()
  }

  async findBeneficiarioByName(nombre) {
    console.log('Buscando beneficiario por nombre:', nombre)
    const benef = await db.collection("beneficiarios").where('nombre', '==', nombre).limit(1).get()
    if (benef.empty) return null
    return { id: benef.docs[0].id, ...benef.docs[0].data() }
  }

  async crearBeneficiario(data) {
    const beneficiario = await db.collection("beneficiarios").doc()
    await beneficiario.set(data)
    return { id: beneficiario.id, ...data }
  }

  async findPagoByContract(contrato) {
    console.log('Buscando pago por contrato: ', contrato)
    const pago = await db.collection("pagos").where('contratoID', '==', contrato).limit(1).get()
    if (pago.empty) return null
    return { id: pago.id, ...pago.docs[0].data() }
  }

}
