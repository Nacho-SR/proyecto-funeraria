/*
  * Módulo de administrativos - Repositorio
*/
import { db } from '../../config/firebase.js'

export class AdministrativosRepository {


  async findUserByEmail(email) {
    console.log('Buscando usuario por email:', email)
    const usua = await db.collection("usuarios").where('email', '==', email).limit(1).get()
    if (usua.empty) return null
    return { id: usua.docs[0].id, ...usua.docs[0].data() }
  }

  async findPaqueteByName(nombre) {
    const paquete = await db.collection("paquetes").where('nombre', '==', nombre).limit(1).get()
    if (paquete.empty) return null
    return { id: paquete.docs[0].id, ...paquete.docs[0].data() }
  }

  async findAdicionalByName(nombre) {
    const adicional = await db.collection("adicionales").where('nombre', '==', nombre).limit(1).get()
    if (adicional.empty) return null
    return { id: adicional.docs[0].id, ...adicional.docs[0].data() }
  }

  async findPromoByIds(paquete_id, adicional_id) {
    const promo = await db.collection("paquete_adicionales")
      .where('paquete_id', '==', paquete_id)
      .where('adicional_id', '==', adicional_id)
      .limit(1)
      .get()
    if (promo.empty) return null
    return { id: promo.docs[0].id, ...promo.docs[0].data() }
  }

  async crearUsuario(data) {
    const usuario = await db.collection("usuarios").doc()
    await usuario.set(data)
    return { id: usuario.id, ...data }
  }

  async crearCliente(data) {
     const cliente = await db.collection("clientes").doc()
     await cliente.set(data)
     return { id: cliente.id, ...data }
  }

  async crearCobrador(data) {
    const cobrador = await db.collection("cobradores").doc()
    await cobrador.set(data)
    return { id: cobrador.id, ...data }
  }

  async crearPromo(data) {
    const promo = await db.collection("paquete_adicionales").doc()
    await promo.set(data)
    return { id: promo.id, ...data }
  }

  async crearNuevoPaquete(data) {
    const paquete = await db.collection("paquetes").doc()
    await paquete.set(data)
    return { id: paquete.id, ...data }
  }

  async crearNuevoAdicional(data) {
    const adicional = await db.collection("adicionales").doc()
    await adicional.set(data)
    return { id: adicional.id, ...data }
  }
}