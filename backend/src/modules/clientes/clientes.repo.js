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

}