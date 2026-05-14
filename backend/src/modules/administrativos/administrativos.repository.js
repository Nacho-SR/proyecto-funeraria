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
}