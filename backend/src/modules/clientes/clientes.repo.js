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

  async listarPagosPorCliente(clienteId) {
    const contratos = await this.listarContratosPorCliente(clienteId)
    const pagosPorContrato = await Promise.all(
      contratos.map(async contrato => {
        const snaps = await this.buscarPorContratoId('pagos', contrato.contratos_id)
        return snaps.map(doc => this.enriquecerPagoCliente(
          { pagos_id: doc.id, ...doc.data() },
          contrato
        ))
      })
    )

    return pagosPorContrato
      .flat()
      .sort((a, b) => this.fechaMillis(b.fecha_pago ?? b.fechaPago ?? b.fecha_creacion) - this.fechaMillis(a.fecha_pago ?? a.fechaPago ?? a.fecha_creacion))
  }

  listarBeneficiariosPorContratos(contratos) {
    return contratos
      .flatMap(contrato =>
        (contrato.beneficiarios ?? []).map(beneficiario =>
          this.enriquecerBeneficiarioCliente(beneficiario, contrato)
        )
      )
      .sort((a, b) => {
        const contratoA = String(a.num_contrato ?? a.contratos_id ?? '')
        const contratoB = String(b.num_contrato ?? b.contratos_id ?? '')
        return contratoA.localeCompare(contratoB)
      })
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

  enriquecerPagoCliente(pago, contrato) {
    return {
      ...pago,
      contratos_id: pago.contratos_id ?? pago.contrato_id ?? contrato.contratos_id,
      contrato_id: pago.contrato_id ?? pago.contratos_id ?? contrato.contratos_id,
      num_contrato: contrato.num_contrato ?? null,
      paquete: contrato.paquete
        ? {
            paquetes_id: contrato.paquete.paquetes_id,
            nombre: contrato.paquete.nombre
          }
        : null,
      contrato_estado: contrato.estado ?? 'activo',
      fecha_pago: pago.fecha_pago ?? pago.fechaPago ?? pago.fecha_creacion ?? null,
      estatus: pago.estatus ?? pago.estado ?? 'pendiente'
    }
  }

  enriquecerBeneficiarioCliente(beneficiario, contrato) {
    return {
      ...beneficiario,
      contratos_id: contrato.contratos_id,
      num_contrato: contrato.num_contrato ?? null,
      contrato_estado: contrato.estado ?? 'activo',
      paquete: contrato.paquete
        ? {
            paquetes_id: contrato.paquete.paquetes_id,
            nombre: contrato.paquete.nombre
          }
        : null
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
