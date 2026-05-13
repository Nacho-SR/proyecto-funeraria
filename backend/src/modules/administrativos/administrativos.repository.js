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

  async findClienteByEmail(email) {
    const cliente = await db.collection("clientes").where('email', '==', email).limit(1).get()
    if (cliente.empty) return null
    return { id: cliente.docs[0].id, ...cliente.docs[0].data() }
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

  async crearContrato(data) {
    const contrato = await db.collection("contratos").doc()
    await contrato.set(data)
    return { id: contrato.id, ...data }
  }

  async buscarUltimoNumeroContrato() {
    const contratos = await db.collection("contratos").orderBy('fecha_creacion', 'desc').limit(1).get()
    if (contratos.empty) return 0
    const ultimoContrato = contratos.docs[0].data()
    return ultimoContrato.num_contrato || 0
  }
}