/*
  * Módulo de administrativos - Repositorio
*/
import { ca } from 'zod/locales'
import { admin, db } from '../../config/firebase.js'
import { email } from 'zod'

export class AdministrativosRepository {


  async findUserByEmail(email) {
    const usua = await db.collection("usuarios").where('email', '==', email).limit(1).get()
    if (usua.empty) return null
    return { usuarios_id: usua.docs[0].id, ...usua.docs[0].data() }
  }

  async findUserById(id) {
    const userDoc = await db.collection("usuarios").doc(id).get()
    if (!userDoc.exists) return null
    return { usuarios_id: userDoc.id, ...userDoc.data() }
  }
  
  async findClienteById(id) {
    const clienteDoc = await db.collection("clientes").doc(id).get()
    if (!clienteDoc.exists) return null
    return { clientes_id: clienteDoc.id, ...clienteDoc.data() }
  }

  async findPaqueteById(id) {
    const paqueteDoc = await db.collection("paquetes").doc(id).get()
    if (!paqueteDoc.exists) return null
    return { paquetes_id: paqueteDoc.id, ...paqueteDoc.data() }
  }

  async findAdicionalById(id) {
    const adicionalDoc = await db.collection("adicionales").doc(id).get()
    if (!adicionalDoc.exists) return null
    return { adicionales_id: adicionalDoc.id, ...adicionalDoc.data() }
  }

  async findPaqueteByName(nombre) {
    const paquete = await db.collection("paquetes").where('nombre', '==', nombre).limit(1).get()
    if (paquete.empty) return null
    return { paquetes_id: paquete.docs[0].id, ...paquete.docs[0].data() }
  }

  async findAdicionalByName(nombre) {
    const adicional = await db.collection("adicionales").where('nombre', '==', nombre).limit(1).get()
    if (adicional.empty) return null
    return { adicionales_id: adicional.docs[0].id, ...adicional.docs[0].data() }
  }

  async findPromoByIds(paquete_id, adicional_id) {
    const promo = await db.collection("paquete_adicionales")
      .where('paquete_id', '==', paquete_id)
      .where('adicional_id', '==', adicional_id)
      .limit(1)
      .get()
    if (promo.empty) return null
    return { paquete_adicionales_id: promo.docs[0].id, ...promo.docs[0].data() }
  }

  async findContratoById(id) {
    const contratoDoc = await db.collection("contratos").doc(id).get()
    if (!contratoDoc.exists) return null
    return { contratos_id: contratoDoc.id, ...contratoDoc.data() }
  }

  async findRutaCobroById(id) {
    const rutaCobroDoc = await db.collection("ruta_cobros").doc(id).get()
    if (!rutaCobroDoc.exists) return null
    return { ruta_cobros_id: rutaCobroDoc.id, ...rutaCobroDoc.data() }
  }

  async obtenerDetallesCobro(rutaCobroId) {
    const detallesSnapshot = await db.collection("detalle_ruta_cobros")
      .where('ruta_cobros_id', '==', rutaCobroId)
      .get()

    // 1. Convertimos los docs del snapshot en un array de promesas
    const promesasDetalles = detallesSnapshot.docs.map(async (detalleDoc) => {
      const detalle = detalleDoc.data();

      const contratoInfo = await this.findContratoById(detalle.contratos_id);
      const clienteInfo = await this.clienteInfoById(contratoInfo.clientes_id);
      
      const direccionCobroDoc = await db.collection("direcciones_cobro").doc(detalle.direccion_cobro_id).get();
      const direccionCobroInfo = direccionCobroDoc.data();

      if (direccionCobroInfo) {
        delete direccionCobroInfo.contrato_id;
      }

      return {
        ...clienteInfo,
        direccionCobro: { ...direccionCobroInfo }
      };
    });

    const detalles = await Promise.all(promesasDetalles);
    return detalles;
  }

  async clienteInfoById(id) {
    const clienteDoc = await db.collection("clientes").doc(id).get()
    if (!clienteDoc.exists) return null
    const userDoc = await db.collection("usuarios").doc(clienteDoc.data().usuarios_id).get()
    if (!userDoc.exists) return null
    
    const userData = userDoc.data()
    const clienteData = clienteDoc.data()
    const clienteInfo = {
      cliente: {
        clientes_id: clienteDoc.id,
        calle: clienteData.calle,
        colonia: clienteData.colonia,
        num_casa: clienteData.num_casa,
        telefono: clienteData.telefono
      },
      usuario: {
        usuarios_id: userDoc.id,
        nombre: userData.nombre,
        apaterno: userData.apaterno,
        amaterno: userData.amaterno,
        email: userData.email
      }
    }
    return clienteInfo
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

  async listarRutasCobro() {
    // 1. Rutas de cobro activas
    const rutasSnapshot = await db.collection('ruta_cobros')
      .where('activo', '==', true)
      .get();
    return rutasSnapshot.docs.map(doc => ({ ruta_cobros_id: doc.id, ...doc.data() }));
  }

  async findClienteByEmail(email) {
    const cliente = await db.collection("clientes").where('email', '==', email).limit(1).get()
    if (cliente.empty) return null
    return { id: cliente.docs[0].id, ...cliente.docs[0].data() }
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

  async crearContrato(data) {
    const contrato = await db.collection("contratos").doc()
    await contrato.set(data)
    return { id: contrato.id, ...data }
  }

  async asignarAdicionalesAContrato(adicionales_contrato) {
    adicionales_contrato.adicionalesInfo.forEach(async adicional => {
      const contratoAdicional = await db.collection("contrato_adicionales").doc()
      await contratoAdicional.set({
        contrato_id: adicionales_contrato.contrato_id,
        adicional_id: adicional.adicional_id,
        precio_unitario: adicional.precio,
        activo: adicionales_contrato.activo ?? true,
        fecha_creacion: adicionales_contrato.fecha_creacion,
        fecha_modificacion: adicionales_contrato.fecha_modificacion
      })
    })
  }

  async asignarBeneficiariosAContrato(beneficiarios_contrato) {
    beneficiarios_contrato.beneficiariosInfo.forEach(async beneficiario => {
      const contratoBeneficiario = await db.collection("beneficiarios").doc()
      await contratoBeneficiario.set({
        nombre: beneficiario.nombre,
        apaterno: beneficiario.apaterno,
        amaterno: beneficiario.amaterno,
        parentesco: beneficiario.parentesco,
        telefono: beneficiario.telefono,
        direccion: beneficiario.direccion,
        contrato_id: beneficiarios_contrato.contrato_id
      })
    })
  }

  async asignarDireccionCobroAContrato(direccion_cobro_contrato) {
    const contratoDireccionCobro = await db.collection("direcciones_cobro").doc()
    await contratoDireccionCobro.set(direccion_cobro_contrato)
  }

  async asignarDetallesRutaCobro(rutaCobroId, detallesInfo) {
    detallesInfo.forEach(async detalle => {
      const detalleDoc = await db.collection("detalle_ruta_cobros").doc()
      await detalleDoc.set({
        ...detalle,
        ruta_cobros_id: rutaCobroId
      })
    })
  }

  async crearRutaCobro(data) {
    const rutaCobro = await db.collection("ruta_cobros").doc()
    await rutaCobro.set(data)
    return { ruta_cobros_id: rutaCobro.id, ...data }
  }

  async buscarUltimoNumeroContrato() {
    const contratos = await db.collection("contratos").orderBy('fecha_creacion', 'desc').limit(1).get()
    if (contratos.empty) return 0
    const ultimoContrato = contratos.docs[0].data()
    return ultimoContrato.num_contrato || 0
  }
}