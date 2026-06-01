<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import api from '@/services/api'

const emit = defineEmits(['guardado', 'cancelado'])

const pasos = ['Cliente', 'Paquete', 'Beneficiarios', 'Cobro', 'Confirmar']
const pasoActual = ref(0)
const clientes = ref([])
const paquetes = ref([])
const adicionales = ref([])
const promociones = ref([])
const cargando = ref(true)
const enviando = ref(false)
const mensajeError = ref('')
const mensajeExito = ref('')
const errores = ref({})

const form = reactive({
  modo_cliente: 'existente',
  clientes_id: '',
  usuario: {
    nombre: '',
    apaterno: '',
    amaterno: '',
    email: '',
    password: ''
  },
  cliente: {
    telefono: '',
    calle: '',
    colonia: '',
    num_casa: ''
  },
  paquetes_id: '',
  fecha_inicio: '',
  frecuencia_pago: 'mensual',
  adicionales: [],
  beneficiarios: [beneficiarioVacio()],
  direccion_cobro: {
    calle: '',
    colonia: '',
    num_casa: '',
    referencia: '',
    horario_atencion: ''
  }
})

onMounted(cargarDatos)

watch(() => form.paquetes_id, () => {
  form.adicionales = []
})

async function cargarDatos() {
  cargando.value = true
  mensajeError.value = ''
  try {
    const [resClientes, resProductos] = await Promise.all([
      api.get('/administrativos/clientes-activos'),
      api.get('/administrativos/productos-activos')
    ])
    clientes.value = resClientes.data?.clientes ?? []
    const productos = resProductos.data?.productosActivos ?? {}
    paquetes.value = productos.paquetes ?? []
    adicionales.value = productos.adicionales ?? []
    promociones.value = productos.promociones ?? []
  } catch (err) {
    mensajeError.value = err.response?.data?.message || 'Error al cargar clientes, paquetes o adicionales.'
  } finally {
    cargando.value = false
  }
}

const clienteSeleccionado = computed(() =>
  clientes.value.find(item => item.cliente?.cliente_id === form.clientes_id || item.cliente?.clientes_id === form.clientes_id)
)

const paqueteSeleccionado = computed(() =>
  paquetes.value.find(paquete => paquete.paquete_id === form.paquetes_id || paquete.paquetes_id === form.paquetes_id)
)

const adicionalesDisponibles = computed(() => adicionales.value)

const adicionalesSeleccionados = computed(() =>
  form.adicionales
    .map(id => {
      const adicional = adicionales.value.find(item => adicionalId(item) === id)
      if (!adicional) return null
      const promo = promoParaAdicional(id)
      const precio = Number(promo?.precio_especial ?? adicional.precio ?? 0)
      return { ...adicional, adicional_id: id, precio, promo }
    })
    .filter(Boolean)
)

const precioBase = computed(() => Number(paqueteSeleccionado.value?.precio_base ?? 0))
const totalAdicionales = computed(() => adicionalesSeleccionados.value.reduce((total, adicional) => total + Number(adicional.precio ?? 0), 0))
const totalContrato = computed(() => precioBase.value + totalAdicionales.value)

// Progreso de la línea animada
const progreso = computed(() =>
  (pasoActual.value / (pasos.length - 1)) * 100
)

function clienteNombre(item) {
  const usuario = item?.usuario
  if (!usuario) return 'Cliente sin nombre'
  return [usuario.nombre, usuario.apaterno, usuario.amaterno].filter(Boolean).join(' ')
}

function adicionalId(adicional) {
  return adicional.adicional_id ?? adicional.adicionales_id ?? adicional.adicionalesID
}

function paqueteId(paquete) {
  return paquete.paquete_id ?? paquete.paquetes_id
}

function promoParaAdicional(adicionalIdValue) {
  return promociones.value.find(promo =>
    (promo.paquete_id ?? promo.paquetes_id) === form.paquetes_id &&
    (promo.adicional_id ?? promo.adicionales_id) === adicionalIdValue
  )
}

function precioAdicional(adicional) {
  const promo = promoParaAdicional(adicionalId(adicional))
  return Number(promo?.precio_especial ?? adicional.precio ?? 0)
}

function alternarAdicional(id) {
  if (form.adicionales.includes(id)) {
    form.adicionales = form.adicionales.filter(item => item !== id)
  } else {
    form.adicionales = [...form.adicionales, id]
  }
}

function beneficiarioVacio() {
  return { nombre: '', apaterno: '', amaterno: '', parentesco: '', telefono: '', direccion: '' }
}

function agregarBeneficiario() {
  if (form.beneficiarios.length < 3) {
    form.beneficiarios.push(beneficiarioVacio())
  }
}

function quitarBeneficiario(index) {
  if (form.beneficiarios.length > 1) {
    form.beneficiarios.splice(index, 1)
  }
}

function usarClienteComoBeneficiario(index) {
  const destino = form.beneficiarios[index]
  if (form.modo_cliente === 'existente' && clienteSeleccionado.value) {
    const usuario = clienteSeleccionado.value.usuario ?? {}
    const cliente = clienteSeleccionado.value.cliente ?? {}
    destino.nombre = usuario.nombre ?? ''
    destino.apaterno = usuario.apaterno ?? ''
    destino.amaterno = usuario.amaterno ?? ''
    destino.parentesco = 'Titular'
    destino.telefono = cliente.telefono ?? ''
    destino.direccion = [cliente.calle, cliente.num_casa, cliente.colonia].filter(Boolean).join(', ')
    return
  }
  destino.nombre = form.usuario.nombre
  destino.apaterno = form.usuario.apaterno
  destino.amaterno = form.usuario.amaterno
  destino.parentesco = 'Titular'
  destino.telefono = form.cliente.telefono
  destino.direccion = [form.cliente.calle, form.cliente.num_casa, form.cliente.colonia].filter(Boolean).join(', ')
}

function usarDireccionCliente() {
  if (form.modo_cliente === 'existente' && clienteSeleccionado.value) {
    const cliente = clienteSeleccionado.value.cliente ?? {}
    form.direccion_cobro.calle = cliente.calle ?? ''
    form.direccion_cobro.colonia = cliente.colonia ?? ''
    form.direccion_cobro.num_casa = cliente.num_casa ?? ''
    return
  }
  form.direccion_cobro.calle = form.cliente.calle
  form.direccion_cobro.colonia = form.cliente.colonia
  form.direccion_cobro.num_casa = form.cliente.num_casa
}

function validarPasoActual() {
  const nuevosErrores = {}
  if (pasoActual.value === 0) {
    if (form.modo_cliente === 'existente') {
      if (!form.clientes_id) nuevosErrores.clientes_id = 'Selecciona un cliente.'
    } else {
      validarTexto(nuevosErrores, 'usuario.nombre', form.usuario.nombre, 3, 'Nombre')
      validarTexto(nuevosErrores, 'usuario.apaterno', form.usuario.apaterno, 3, 'Apellido paterno')
      validarTexto(nuevosErrores, 'usuario.amaterno', form.usuario.amaterno, 3, 'Apellido materno')
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.usuario.email)) nuevosErrores['usuario.email'] = 'Email invalido.'
      validarTexto(nuevosErrores, 'usuario.password', form.usuario.password, 6, 'Contraseña')
      validarTexto(nuevosErrores, 'cliente.telefono', form.cliente.telefono, 7, 'Telefono')
      validarTexto(nuevosErrores, 'cliente.calle', form.cliente.calle, 3, 'Calle')
      validarTexto(nuevosErrores, 'cliente.colonia', form.cliente.colonia, 3, 'Colonia')
      validarTexto(nuevosErrores, 'cliente.num_casa', form.cliente.num_casa, 1, 'Numero de casa')
    }
  }
  if (pasoActual.value === 1) {
    if (!form.paquetes_id) nuevosErrores.paquetes_id = 'Selecciona un paquete.'
    if (!form.fecha_inicio) nuevosErrores.fecha_inicio = 'Selecciona la fecha de inicio.'
    if (!form.frecuencia_pago) nuevosErrores.frecuencia_pago = 'Selecciona la frecuencia de pago.'
  }
  if (pasoActual.value === 2) {
    if (form.beneficiarios.length < 1 || form.beneficiarios.length > 3) {
      nuevosErrores.beneficiarios = 'Registra de 1 a 3 beneficiarios.'
    }
    form.beneficiarios.forEach((beneficiario, index) => {
      validarTexto(nuevosErrores, `beneficiario.${index}.nombre`, beneficiario.nombre, 3, 'Nombre')
      validarTexto(nuevosErrores, `beneficiario.${index}.apaterno`, beneficiario.apaterno, 3, 'Apellido paterno')
      validarTexto(nuevosErrores, `beneficiario.${index}.amaterno`, beneficiario.amaterno, 3, 'Apellido materno')
      validarTexto(nuevosErrores, `beneficiario.${index}.parentesco`, beneficiario.parentesco, 3, 'Parentesco')
      validarTexto(nuevosErrores, `beneficiario.${index}.telefono`, beneficiario.telefono, 7, 'Telefono')
      validarTexto(nuevosErrores, `beneficiario.${index}.direccion`, beneficiario.direccion, 4, 'Direccion')
    })
  }
  if (pasoActual.value === 3) {
    validarTexto(nuevosErrores, 'direccion_cobro.calle', form.direccion_cobro.calle, 3, 'Calle')
    validarTexto(nuevosErrores, 'direccion_cobro.colonia', form.direccion_cobro.colonia, 3, 'Colonia')
    validarTexto(nuevosErrores, 'direccion_cobro.num_casa', form.direccion_cobro.num_casa, 1, 'Numero de casa')
    validarTexto(nuevosErrores, 'direccion_cobro.referencia', form.direccion_cobro.referencia, 5, 'Referencia')
    validarTexto(nuevosErrores, 'direccion_cobro.horario_atencion', form.direccion_cobro.horario_atencion, 5, 'Horario de atencion')
  }
  errores.value = nuevosErrores
  return Object.keys(nuevosErrores).length === 0
}

function validarTexto(target, key, value, min, label) {
  if (!String(value ?? '').trim() || String(value ?? '').trim().length < min) {
    target[key] = `${label} debe tener al menos ${min} caracteres.`
  }
}

function siguiente() {
  mensajeError.value = ''
  if (!validarPasoActual()) return
  pasoActual.value = Math.min(pasoActual.value + 1, pasos.length - 1)
  errores.value = {}
}

function anterior() {
  pasoActual.value = Math.max(pasoActual.value - 1, 0)
  errores.value = {}
}

function payloadContrato() {
  const payload = {
    paquetes_id: form.paquetes_id,
    fecha_inicio: form.fecha_inicio,
    frecuencia_pago: form.frecuencia_pago,
    beneficiarios: form.beneficiarios.map(b => ({ ...b })),
    direccion_cobro: { ...form.direccion_cobro },
    adicionales: adicionalesSeleccionados.value.map(a => ({
      adicional_id: a.adicional_id,
      precio: Number(a.precio)
    }))
  }
  if (form.modo_cliente === 'existente') {
    payload.clientes_id = form.clientes_id
  } else {
    payload.nuevo_cliente = {
      usuario: { ...form.usuario },
      cliente: { ...form.cliente }
    }
  }
  return payload
}

async function guardar() {
  mensajeError.value = ''
  mensajeExito.value = ''
  for (let i = 0; i < pasos.length - 1; i += 1) {
    pasoActual.value = i
    if (!validarPasoActual()) return
  }
  pasoActual.value = pasos.length - 1
  enviando.value = true
  try {
    const { data } = await api.post('/administrativos/nuevo-contrato', payloadContrato())
    mensajeExito.value = 'Contrato registrado correctamente.'
    emit('guardado', data)
    limpiar()
  } catch (err) {
    mensajeError.value = err.response?.data?.message || 'Error al guardar el contrato.'
  } finally {
    enviando.value = false
  }
}

function limpiar() {
  pasoActual.value = 0
  Object.assign(form, {
    modo_cliente: 'existente',
    clientes_id: '',
    usuario: { nombre: '', apaterno: '', amaterno: '', email: '', password: '' },
    cliente: { telefono: '', calle: '', colonia: '', num_casa: '' },
    paquetes_id: '',
    fecha_inicio: '',
    frecuencia_pago: 'mensual',
    adicionales: [],
    beneficiarios: [beneficiarioVacio()],
    direccion_cobro: { calle: '', colonia: '', num_casa: '', referencia: '', horario_atencion: '' }
  })
  errores.value = {}
}

function cancelar() {
  limpiar()
  emit('cancelado')
}

function formatoMoneda(valor) {
  return Number(valor ?? 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' })
}
</script>

<template>
  <div v-if="cargando" class="text-center py-4">
    <div class="spinner-border text-secondary" role="status"></div>
  </div>

  <div v-else>
    <div v-if="mensajeExito" class="alert alert-success">{{ mensajeExito }}</div>
    <div v-if="mensajeError" class="alert alert-danger">{{ mensajeError }}</div>

    <!-- ── STEPPER VISUAL (nodos + línea animada) ── -->
    <div class="stepper-wrap mb-5">
      <div class="stepper-line-bg"></div>
      <div class="stepper-line-fill" :style="{ width: progreso + '%' }"></div>
      <div class="stepper-nodes">
        <div v-for="(paso, i) in pasos" :key="i" class="stepper-node">
          <div
            class="node-circle"
            :class="{
              'node-completado': i < pasoActual,
              'node-activo':    i === pasoActual,
              'node-inactivo':  i > pasoActual,
            }"
          >
            <svg v-if="i < pasoActual" width="16" height="12" viewBox="0 0 14 11" fill="none">
              <path d="M1 5.5L5 9.5L13 1.5" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            <span v-else>{{ i + 1 }}</span>
          </div>
          <span class="node-label" :class="{ 'text-muted': i > pasoActual }">{{ paso }}</span>
        </div>
      </div>
    </div>

    <!-- ── PASO 0: Cliente ── -->
    <section v-if="pasoActual === 0" class="step-panel">
      <h5 class="fw-bold mb-3">Cliente titular</h5>
      <div class="btn-group mb-3">
        <button type="button" class="btn btn-filtro" :class="{ activo: form.modo_cliente === 'existente' }" @click="form.modo_cliente = 'existente'">
          Cliente existente
        </button>
        <button type="button" class="btn btn-filtro" :class="{ activo: form.modo_cliente === 'nuevo' }" @click="form.modo_cliente = 'nuevo'">
          Nuevo cliente
        </button>
      </div>

      <div v-if="form.modo_cliente === 'existente'" class="row g-3">
        <div class="col-md-8">
          <label class="form-label" for="clientes_id">Cliente</label>
          <select id="clientes_id" v-model="form.clientes_id" class="form-select" :class="{ 'is-invalid': errores.clientes_id }">
            <option value="" disabled>Selecciona un cliente</option>
            <option v-for="item in clientes" :key="item.cliente?.cliente_id" :value="item.cliente?.cliente_id">
              {{ clienteNombre(item) }} · {{ item.cliente?.telefono ?? 'Sin telefono' }}
            </option>
          </select>
          <div class="invalid-feedback">{{ errores.clientes_id }}</div>
        </div>
      </div>

      <div v-else class="row g-3">
        <div class="col-md-4">
          <label class="form-label">Nombre</label>
          <input v-model="form.usuario.nombre" class="form-control" :class="{ 'is-invalid': errores['usuario.nombre'] }" />
          <div class="invalid-feedback">{{ errores['usuario.nombre'] }}</div>
        </div>
        <div class="col-md-4">
          <label class="form-label">Apellido paterno</label>
          <input v-model="form.usuario.apaterno" class="form-control" :class="{ 'is-invalid': errores['usuario.apaterno'] }" />
          <div class="invalid-feedback">{{ errores['usuario.apaterno'] }}</div>
        </div>
        <div class="col-md-4">
          <label class="form-label">Apellido materno</label>
          <input v-model="form.usuario.amaterno" class="form-control" :class="{ 'is-invalid': errores['usuario.amaterno'] }" />
          <div class="invalid-feedback">{{ errores['usuario.amaterno'] }}</div>
        </div>
        <div class="col-md-6">
          <label class="form-label">Email</label>
          <input v-model="form.usuario.email" type="email" class="form-control" :class="{ 'is-invalid': errores['usuario.email'] }" />
          <div class="invalid-feedback">{{ errores['usuario.email'] }}</div>
        </div>
        <div class="col-md-6">
          <label class="form-label">Contraseña</label>
          <input v-model="form.usuario.password" type="password" class="form-control" :class="{ 'is-invalid': errores['usuario.password'] }" />
          <div class="invalid-feedback">{{ errores['usuario.password'] }}</div>
        </div>
        <div class="col-md-3">
          <label class="form-label">Telefono</label>
          <input v-model="form.cliente.telefono" class="form-control" :class="{ 'is-invalid': errores['cliente.telefono'] }" />
          <div class="invalid-feedback">{{ errores['cliente.telefono'] }}</div>
        </div>
        <div class="col-md-4">
          <label class="form-label">Calle</label>
          <input v-model="form.cliente.calle" class="form-control" :class="{ 'is-invalid': errores['cliente.calle'] }" />
          <div class="invalid-feedback">{{ errores['cliente.calle'] }}</div>
        </div>
        <div class="col-md-3">
          <label class="form-label">Colonia</label>
          <input v-model="form.cliente.colonia" class="form-control" :class="{ 'is-invalid': errores['cliente.colonia'] }" />
          <div class="invalid-feedback">{{ errores['cliente.colonia'] }}</div>
        </div>
        <div class="col-md-2">
          <label class="form-label">Num. casa</label>
          <input v-model="form.cliente.num_casa" class="form-control" :class="{ 'is-invalid': errores['cliente.num_casa'] }" />
          <div class="invalid-feedback">{{ errores['cliente.num_casa'] }}</div>
        </div>
      </div>
    </section>

    <!-- ── PASO 1: Paquete ── -->
    <section v-if="pasoActual === 1" class="step-panel">
      <h5 class="fw-bold mb-3">Paquete y adicionales</h5>
      <div class="row g-3 mb-4">
        <div class="col-md-5">
          <label class="form-label">Paquete</label>
          <select v-model="form.paquetes_id" class="form-select" :class="{ 'is-invalid': errores.paquetes_id }">
            <option value="" disabled>Selecciona un paquete</option>
            <option v-for="paquete in paquetes" :key="paqueteId(paquete)" :value="paqueteId(paquete)">
              {{ paquete.nombre }} · {{ formatoMoneda(paquete.precio_base) }}
            </option>
          </select>
          <div class="invalid-feedback">{{ errores.paquetes_id }}</div>
        </div>
        <div class="col-md-4">
          <label class="form-label">Fecha inicio</label>
          <input v-model="form.fecha_inicio" type="date" class="form-control" :class="{ 'is-invalid': errores.fecha_inicio }" />
          <div class="invalid-feedback">{{ errores.fecha_inicio }}</div>
        </div>
        <div class="col-md-3">
          <label class="form-label">Frecuencia</label>
          <select v-model="form.frecuencia_pago" class="form-select">
            <option value="semanal">Semanal</option>
            <option value="quincenal">Quincenal</option>
            <option value="mensual">Mensual</option>
          </select>
        </div>
      </div>
      <div class="adicional-grid">
        <label v-for="adicional in adicionalesDisponibles" :key="adicionalId(adicional)" class="adicional-card">
          <input type="checkbox" class="form-check-input"
            :checked="form.adicionales.includes(adicionalId(adicional))"
            :disabled="!form.paquetes_id"
            @change="alternarAdicional(adicionalId(adicional))"
          />
          <div>
            <strong>{{ adicional.nombre }}</strong>
            <p class="text-muted mb-1">{{ adicional.descripcion }}</p>
            <span>{{ formatoMoneda(precioAdicional(adicional)) }}</span>
            <span v-if="promoParaAdicional(adicionalId(adicional))" class="badge bg-success ms-2">Promo</span>
          </div>
        </label>
      </div>
    </section>

    <!-- ── PASO 2: Beneficiarios ── -->
    <section v-if="pasoActual === 2" class="step-panel">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h5 class="fw-bold mb-0">Beneficiarios</h5>
        <button type="button" class="btn btn-sm btn-outline-secondary" @click="agregarBeneficiario" :disabled="form.beneficiarios.length >= 3">
          Agregar beneficiario
        </button>
      </div>
      <div v-if="errores.beneficiarios" class="alert alert-danger">{{ errores.beneficiarios }}</div>
      <div v-for="(beneficiario, index) in form.beneficiarios" :key="index" class="beneficiario-panel">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <strong>Beneficiario {{ index + 1 }}</strong>
          <div class="d-flex gap-2">
            <button type="button" class="btn btn-sm btn-outline-secondary" @click="usarClienteComoBeneficiario(index)">Usar titular</button>
            <button type="button" class="btn btn-sm btn-outline-danger" @click="quitarBeneficiario(index)" :disabled="form.beneficiarios.length === 1">Quitar</button>
          </div>
        </div>
        <div class="row g-3">
          <div class="col-md-4">
            <label class="form-label">Nombre</label>
            <input v-model="beneficiario.nombre" class="form-control" :class="{ 'is-invalid': errores[`beneficiario.${index}.nombre`] }" />
            <div class="invalid-feedback">{{ errores[`beneficiario.${index}.nombre`] }}</div>
          </div>
          <div class="col-md-4">
            <label class="form-label">Apellido paterno</label>
            <input v-model="beneficiario.apaterno" class="form-control" :class="{ 'is-invalid': errores[`beneficiario.${index}.apaterno`] }" />
            <div class="invalid-feedback">{{ errores[`beneficiario.${index}.apaterno`] }}</div>
          </div>
          <div class="col-md-4">
            <label class="form-label">Apellido materno</label>
            <input v-model="beneficiario.amaterno" class="form-control" :class="{ 'is-invalid': errores[`beneficiario.${index}.amaterno`] }" />
            <div class="invalid-feedback">{{ errores[`beneficiario.${index}.amaterno`] }}</div>
          </div>
          <div class="col-md-4">
            <label class="form-label">Parentesco</label>
            <input v-model="beneficiario.parentesco" class="form-control" :class="{ 'is-invalid': errores[`beneficiario.${index}.parentesco`] }" />
            <div class="invalid-feedback">{{ errores[`beneficiario.${index}.parentesco`] }}</div>
          </div>
          <div class="col-md-4">
            <label class="form-label">Telefono</label>
            <input v-model="beneficiario.telefono" class="form-control" :class="{ 'is-invalid': errores[`beneficiario.${index}.telefono`] }" />
            <div class="invalid-feedback">{{ errores[`beneficiario.${index}.telefono`] }}</div>
          </div>
          <div class="col-md-4">
            <label class="form-label">Direccion</label>
            <input v-model="beneficiario.direccion" class="form-control" :class="{ 'is-invalid': errores[`beneficiario.${index}.direccion`] }" />
            <div class="invalid-feedback">{{ errores[`beneficiario.${index}.direccion`] }}</div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── PASO 3: Cobro ── -->
    <section v-if="pasoActual === 3" class="step-panel">
      <div class="d-flex justify-content-between align-items-center mb-3">
        <h5 class="fw-bold mb-0">Direccion de cobro</h5>
        <button type="button" class="btn btn-sm btn-outline-secondary" @click="usarDireccionCliente">
          Usar direccion del cliente
        </button>
      </div>
      <div class="row g-3">
        <div class="col-md-4">
          <label class="form-label">Calle</label>
          <input v-model="form.direccion_cobro.calle" class="form-control" :class="{ 'is-invalid': errores['direccion_cobro.calle'] }" />
          <div class="invalid-feedback">{{ errores['direccion_cobro.calle'] }}</div>
        </div>
        <div class="col-md-4">
          <label class="form-label">Colonia</label>
          <input v-model="form.direccion_cobro.colonia" class="form-control" :class="{ 'is-invalid': errores['direccion_cobro.colonia'] }" />
          <div class="invalid-feedback">{{ errores['direccion_cobro.colonia'] }}</div>
        </div>
        <div class="col-md-4">
          <label class="form-label">Num. casa</label>
          <input v-model="form.direccion_cobro.num_casa" class="form-control" :class="{ 'is-invalid': errores['direccion_cobro.num_casa'] }" />
          <div class="invalid-feedback">{{ errores['direccion_cobro.num_casa'] }}</div>
        </div>
        <div class="col-md-6">
          <label class="form-label">Referencia</label>
          <input v-model="form.direccion_cobro.referencia" class="form-control" :class="{ 'is-invalid': errores['direccion_cobro.referencia'] }" />
          <div class="invalid-feedback">{{ errores['direccion_cobro.referencia'] }}</div>
        </div>
        <div class="col-md-6">
          <label class="form-label">Horario de atencion</label>
          <input v-model="form.direccion_cobro.horario_atencion" class="form-control" :class="{ 'is-invalid': errores['direccion_cobro.horario_atencion'] }" />
          <div class="invalid-feedback">{{ errores['direccion_cobro.horario_atencion'] }}</div>
        </div>
      </div>
    </section>

    <!-- ── PASO 4: Confirmar ── -->
    <section v-if="pasoActual === 4" class="step-panel">
      <h5 class="fw-bold mb-3">Resumen</h5>
      <div class="resumen-grid">
        <div>
          <span>Cliente</span>
          <strong>{{ form.modo_cliente === 'existente' ? clienteNombre(clienteSeleccionado) : `${form.usuario.nombre} ${form.usuario.apaterno}` }}</strong>
        </div>
        <div>
          <span>Paquete</span>
          <strong>{{ paqueteSeleccionado?.nombre ?? 'Sin paquete' }}</strong>
        </div>
        <div>
          <span>Fecha inicio</span>
          <strong>{{ form.fecha_inicio }}</strong>
        </div>
        <div>
          <span>Frecuencia</span>
          <strong>{{ form.frecuencia_pago }}</strong>
        </div>
        <div>
          <span>Beneficiarios</span>
          <strong>{{ form.beneficiarios.length }}</strong>
        </div>
        <div>
          <span>Total</span>
          <strong>{{ formatoMoneda(totalContrato) }}</strong>
        </div>
      </div>
    </section>

    <!-- ── NAVEGACIÓN ── -->
    <div class="acciones mt-4">
      <button type="button" class="btn btn-outline-secondary" @click="cancelar" :disabled="enviando">Cancelar</button>
      <button v-if="pasoActual > 0" type="button" class="btn btn-outline-secondary" @click="anterior" :disabled="enviando">Anterior</button>
      <button v-if="pasoActual < pasos.length - 1" type="button" class="btn btn-custom" @click="siguiente">Siguiente</button>
      <button v-else type="button" class="btn btn-custom" @click="guardar" :disabled="enviando">
        <span v-if="enviando" class="spinner-border spinner-border-sm me-2"></span>
        {{ enviando ? 'Guardando...' : 'Guardar contrato' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
/* ── Stepper visual ── */
.stepper-wrap {
  position: relative;
  padding: 0 24px;
}
.stepper-line-bg {
  position: absolute;
  top: 19px;
  left: 48px;
  right: 48px;
  height: 3px;
  background: #e0e0e0;
  border-radius: 2px;
}
.stepper-line-fill {
  position: absolute;
  top: 19px;
  left: 48px;
  height: 3px;
  background: var(--primary, #2F4156);
  border-radius: 2px;
  transition: width 0.45s ease;
  max-width: calc(100% - 96px);
}
.stepper-nodes {
  position: relative;
  display: flex;
  justify-content: space-between;
}
.stepper-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.node-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 500;
  background: #fff;
  transition: all 0.35s ease;
}
.node-inactivo  { border: 2px solid #ccc; color: #999; }
.node-activo    { border: 2px solid var(--primary, #2F4156); color: var(--primary, #2F4156); box-shadow: 0 0 0 4px rgba(47,65,86,0.12); }
.node-completado { background: var(--primary, #2F4156); border: 2px solid var(--primary, #2F4156); color: #fff; }
.node-label {
  font-size: 13px;
  font-weight: 500;
  text-align: center;
  max-width: 80px;
}

/* ── Resto del componente (sin cambios) ── */
.step-panel {
  border: 1px solid #e5edf2;
  border-radius: 8px;
  padding: 18px;
  background: #fff;
}
.btn-filtro {
  border: 1.5px solid var(--secondary);
  color: var(--secondary);
  background: #fff;
}
.btn-filtro.activo {
  background: var(--secondary);
  color: #fff;
}
.adicional-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 12px;
}
.adicional-card {
  border: 1px solid #e5edf2;
  border-radius: 8px;
  padding: 12px;
  display: flex;
  align-items: flex-start;
  gap: 10px;
  cursor: pointer;
}
.beneficiario-panel {
  border: 1px solid #e5edf2;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 14px;
}
.resumen-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}
.resumen-grid div {
  border: 1px solid #e5edf2;
  border-radius: 8px;
  padding: 12px;
}
.resumen-grid span {
  display: block;
  color: #667085;
  font-size: 0.82rem;
  font-weight: 600;
}
.acciones {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
@media (max-width: 768px) {
  .stepper-nodes { flex-wrap: wrap; gap: 12px; }
  .stepper-line-bg, .stepper-line-fill { display: none; }
  .acciones { flex-wrap: wrap; }
}
</style>