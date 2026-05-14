/*
  * Módulo de administrativos - Repositorio
*/
import { admin, db } from '../../config/firebase.js'

export class AdministrativosRepository {


  async findUserByEmail(email) {
    console.log('Buscando usuario por email:', email)
    const usua = await db.collection("usuarios").where('email', '==', email).limit(1).get()
    if (usua.empty) return null
    return { id: usua.docs[0].id, ...usua.docs[0].data() }
  }
  
  async findClienteById(id) {
    const clienteDoc = await db.collection("clientes").doc(id).get()
    if (!clienteDoc.exists) return null
    return { cliente_id: clienteDoc.id, ...clienteDoc.data() }
  }

  async findPaqueteByName(nombre) {
    const paquete = await db.collection("paquetes").where('nombre', '==', nombre).limit(1).get()
    if (paquete.empty) return null
    return { paquete_id: paquete.docs[0].id, ...paquete.docs[0].data() }
  }

  async findAdicionalByName(nombre) {
    const adicional = await db.collection("adicionales").where('nombre', '==', nombre).limit(1).get()
    if (adicional.empty) return null
    return { adicional_id: adicional.docs[0].id, ...adicional.docs[0].data() }
  }

  async findPromoByIds(paquete_id, adicional_id) {
    const promo = await db.collection("paquete_adicionales")
      .where('paquete_id', '==', paquete_id)
      .where('adicional_id', '==', adicional_id)
      .limit(1)
      .get()
    if (promo.empty) return null
    return { promo_id: promo.docs[0].id, ...promo.docs[0].data() }
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
      const cliente = { cliente_id: doc.id, ...doc.data() };
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
            email: data.email
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
      const cobrador = { cobrador_id: doc.id, ...doc.data() };
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
            email: data.email
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

  async listarProductosActivos() {
    const promos = await db.collection('paquete_adicionales').where('activo', '==', true).get()
    const paquetes = await db.collection('paquetes').where('activo', '==', true).get()
    const adicionales = await db.collection('adicionales').where('activo', '==', true).get()

    const resultado = {
      paquetes: paquetes.docs.map(doc => ({ paquete_id: doc.id, ...doc.data() })),
      adicionales: adicionales.docs.map(doc => ({ adicional_id: doc.id, ...doc.data() })),
      promociones: promos.docs.map(doc => ({ promo_id: doc.id, ...doc.data() }))
    }
    return resultado
  }

  async crearUsuario(data) {
    const usuario = await db.collection("usuarios").doc()
    await usuario.set(data)
    return { usuario_id: usuario.id, ...data }
  }

  async crearCliente(data) {
     const cliente = await db.collection("clientes").doc()
     await cliente.set(data)
     return { cliente_id: cliente.id, ...data }
  }

  async crearCobrador(data) {
    const cobrador = await db.collection("cobradores").doc()
    await cobrador.set(data)
    return { cobrador_id: cobrador.id, ...data }
  }

  async crearPromo(data) {
    const promo = await db.collection("paquete_adicionales").doc()
    await promo.set(data)
    return { promo_id: promo.id, ...data }
  }

  async crearNuevoPaquete(data) {
    const paquete = await db.collection("paquetes").doc()
    await paquete.set(data)
    return { paquete_id: paquete.id, ...data }
  }

  async crearNuevoAdicional(data) {
    const adicional = await db.collection("adicionales").doc()
    await adicional.set(data)
    return { adicional_id: adicional.id, ...data }
  }
  
  async darBajaCliente(clienteId) {
    try {
    const clienteRef = db.collection("clientes").doc(clienteId);
    await clienteRef.update({
      activo: false,
      fecha_modificacion: admin.firestore.FieldValue.serverTimestamp()
    });

    const clienteDoc = await clienteRef.get();
    const usuarioId = clienteDoc.data().usuarios_id;
    const usuarioRef = db.collection("usuarios").doc(usuarioId);
    await usuarioRef.update({
      activo: false,
      fecha_modificacion: admin.firestore.FieldValue.serverTimestamp()
    });
    
    console.log('Cliente dado de baja exitosamente con su usuario asociado');
  } catch (error) {
    console.error('Error al dar de baja cliente:', error);
    throw error; // o retorna un error controlado según tu lógica
  }
  }
}