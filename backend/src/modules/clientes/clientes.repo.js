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

}
