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

  async crearUsuario(data) {
    const usuario = await db.collection("usuarios").doc()
    await usuario.set(data)
    return { id: usuario.id, ...data }
  }

  async editarUsuario(data) {
    const usuario = await db.collection("usuarios").doc()
    await usuario.set(data)
    return { ...data }
  }
  async crearCliente(data) {
     const cliente = await db.collection("clientes").doc()
     await cliente.set(data)
     return { id: cliente.id, ...data }
  }

  async editarCliente(data) {
    const cliente = await db.collection("clientes").doc()
    await cliente.set(data)
    return { ...data }
  }

  async crearCobrador(data) {
    const cobrador = await db.collection("cobradores").doc()
    await cobrador.set(data)
    return { id: cobrador.id, ...data }
  }

  async editarCobrador(data) {
    const cobrador = await db.collection("cobradores").doc()
    await cobrador.set(data)
    return { ...data }
  }
}