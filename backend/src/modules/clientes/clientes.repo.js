import { db } from '../../config/firebase.js'

export class ClientesRepository {


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

  async newPago(data) {
    const pago = await db.collection("pagos").doc()
    await pago.set(data)
    return { id: pago.id, ...data }
  }

  async getPagosByClient(cliente) {
    console.log('Buscando historial de pagos:', cliente)
    const pagos = await db.collection("pagos").where('clienteID', '==', clienteID).orderBy('fechaPago', 'desc').get()
    if (pagos.empty) return []
    return pagos.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }))
  }

}
