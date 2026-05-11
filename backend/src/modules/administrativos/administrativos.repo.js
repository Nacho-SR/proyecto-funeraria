/*
  * Módulo de administrativos - Repositorio
*/
import { db } from '../../config/firebase.js'

export class AdministrativosRepository {


  async findUserByEmail(email) {
    const usua = await db.collection("usuarios").where('email', '==', email).limit(1).get()
    if (usua.empty) return null
    return { id: usua.docs[0].id, ...usua.docs[0].data() }
  }

  async crearUsuario(data) {
    const docRef = await db.collection("usuarios").doc()
    const doc = await docRef.set(data)
    return { id: doc.id, ...doc.data() }
  }
}