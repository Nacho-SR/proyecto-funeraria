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

  async listarClientesActivos() {

    // 1. Clientes activos
    const clientesSnapshot = await db.collection('clientes')
      .where('activo', '==', true)
      .get();

    if (clientesSnapshot.empty) {
      return [];
    }

    const clientesData = [];
    const usuariosIds = [];

    clientesSnapshot.forEach(doc => {
      const cliente = { id: doc.id, ...doc.data() };
      clientesData.push(cliente);
      if (cliente.usuarios_id) {
        usuariosIds.push(cliente.usuarios_id);
      }
    });

    // 2. IDs únicos de usuario
    const uniqueUserIds = [...new Set(usuariosIds)];
    const userRefs = uniqueUserIds.map(id => db.collection('usuarios').doc(id));

    // 3. Leer todos los usuarios (documentos completos)
    let usuariosMap = new Map();
    if (userRefs.length > 0) {
      const userSnapshots = await db.getAll(...userRefs);
      userSnapshots.forEach(userDoc => {
        if (userDoc.exists) {
          const data = userDoc.data();
          // Solo extraemos los campos que nos interesan
          usuariosMap.set(userDoc.id, {
            nombre: data.nombre,
            apaterno: data.apaterno,
            amaterno: data.amaterno,
          });
        }
      });
    }

    // 4. Combinar cliente + usuario filtrado
    const resultado = clientesData.map(cliente => ({
      cliente,
      usuario: cliente.usuarios_id
        ? (usuariosMap.get(cliente.usuarios_id) || null)
        : null,
    }));

    return resultado;
  }

  async listarCobradoresActivos() {

    // 1. Cobradores activos
    const cobradoresSnapshot = await db.collection('cobradores')
      .where('activo', '==', true)
      .get();

    if (cobradoresSnapshot.empty) {
      return [];
    }

    const cobradoresData = [];
    const usuariosIds = [];

    cobradoresSnapshot.forEach(doc => {
      const cobrador = { id: doc.id, ...doc.data() };
      cobradoresData.push(cobrador);
      if (cobrador.usuarios_id) {
        usuariosIds.push(cobrador.usuarios_id);
      }
    });

    // 2. IDs únicos de usuario
    const uniqueUserIds = [...new Set(usuariosIds)];
    const userRefs = uniqueUserIds.map(id => db.collection('usuarios').doc(id));

    // 3. Leer todos los usuarios (documentos completos)
    let usuariosMap = new Map();
    if (userRefs.length > 0) {
      const userSnapshots = await db.getAll(...userRefs);
      userSnapshots.forEach(userDoc => {
        if (userDoc.exists) {
          const data = userDoc.data();
          // Solo extraemos los campos que nos interesan
          usuariosMap.set(userDoc.id, {
            nombre: data.nombre,
            apaterno: data.apaterno,
            amaterno: data.amaterno,
          });
        }
      });
    }

    // 4. Combinar cobrador + usuario filtrado
    const resultado = cobradoresData.map(cobrador => ({
      cobrador,
      usuario: cobrador.usuarios_id
        ? (usuariosMap.get(cobrador.usuarios_id) || null)
        : null,
    }));

    return resultado;
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