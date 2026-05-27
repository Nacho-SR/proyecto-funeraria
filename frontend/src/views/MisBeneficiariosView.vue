<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { clienteContratosService } from '@/services/clienteContratos.service'

const beneficiarios = ref([])
const contratos = ref([])
const solicitudes = ref([])
const cargando = ref(false)
const enviando = ref(false)
const error = ref('')
const exito = ref('')
const busqueda = ref('')
const filtroContrato = ref('todos')
const formAbierto = ref(false)

const form = reactive({
  tipo: 'crear',
  contratos_id: '',
  beneficiario_id: '',
  motivo_cliente: '',
  datos_propuestos: beneficiarioVacio()
})

const contratosDisponibles = computed(() =>
  contratos.value.map(contrato => ({
    id: contrato.contratos_id,
    etiqueta: contrato.num_contrato ?? contrato.contratos_id,
    paquete: contrato.paquete?.nombre ?? 'Sin paquete'
  }))
)

const beneficiariosFiltrados = computed(() => {
  const q = busqueda.value.trim().toLowerCase()

  return beneficiarios.value.filter(beneficiario => {
    const texto = [
      nombreCompleto(beneficiario),
      beneficiario.parentesco,
      beneficiario.telefono,
      beneficiario.num_contrato,
      beneficiario.paquete?.nombre
    ].filter(Boolean).join(' ').toLowerCase()

    const coincideTexto = !q || texto.includes(q)
    const coincideContrato = filtroContrato.value === 'todos' || beneficiario.contratos_id === filtroContrato.value

    return coincideTexto && coincideContrato
  })
})

const solicitudesPendientes = computed(() =>
  solicitudes.value.filter(solicitud => solicitud.estado === 'pendiente')
)

async function cargarTodo() {
  cargando.value = true
  error.value = ''

  try {
    const [resBeneficiarios, resSolicitudes, resContratos] = await Promise.all([
      clienteContratosService.listarMisBeneficiarios(),
      clienteContratosService.listarSolicitudesBeneficiarios(),
      clienteContratosService.listarMisContratos()
    ])

    beneficiarios.value = resBeneficiarios.data.beneficiarios ?? []
    solicitudes.value = resSolicitudes.data.solicitudes ?? []
    contratos.value = resContratos.data.contratos ?? []
  } catch (err) {
    error.value = err.response?.data?.error ?? 'No se pudo cargar la informacion de beneficiarios.'
  } finally {
    cargando.value = false
  }
}

function abrirCrear() {
  limpiarFormulario()
  form.tipo = 'crear'
  form.contratos_id = contratosDisponibles.value[0]?.id ?? ''
  formAbierto.value = true
}

function abrirEditar(beneficiario) {
  limpiarFormulario()
  form.tipo = 'actualizar'
  form.contratos_id = beneficiario.contratos_id
  form.beneficiario_id = beneficiario.beneficiario_id
  form.datos_propuestos = {
    nombre: beneficiario.nombre ?? '',
    apaterno: beneficiario.apaterno ?? '',
    amaterno: beneficiario.amaterno ?? '',
    parentesco: beneficiario.parentesco ?? '',
    telefono: beneficiario.telefono ?? '',
    direccion: beneficiario.direccion ?? ''
  }
  formAbierto.value = true
}

function abrirEliminar(beneficiario) {
  limpiarFormulario()
  form.tipo = 'eliminar'
  form.contratos_id = beneficiario.contratos_id
  form.beneficiario_id = beneficiario.beneficiario_id
  form.datos_propuestos = beneficiarioVacio()
  formAbierto.value = true
}

function cerrarFormulario() {
  formAbierto.value = false
  limpiarFormulario()
}

function limpiarFormulario() {
  error.value = ''
  exito.value = ''
  form.tipo = 'crear'
  form.contratos_id = ''
  form.beneficiario_id = ''
  form.motivo_cliente = ''
  form.datos_propuestos = beneficiarioVacio()
}

async function enviarSolicitud() {
  error.value = ''
  exito.value = ''

  if (!form.contratos_id) {
    error.value = 'Selecciona un contrato.'
    return
  }

  if (form.tipo !== 'eliminar' && (!form.datos_propuestos.nombre || !form.datos_propuestos.parentesco)) {
    error.value = 'Nombre y parentesco son obligatorios.'
    return
  }

  enviando.value = true
  try {
    const payload = {
      tipo: form.tipo,
      contratos_id: form.contratos_id,
      motivo_cliente: form.motivo_cliente
    }

    if (form.beneficiario_id) payload.beneficiario_id = form.beneficiario_id
    if (form.tipo !== 'eliminar') payload.datos_propuestos = form.datos_propuestos

    await clienteContratosService.crearSolicitudBeneficiario(payload)
    exito.value = 'Solicitud enviada para revision.'
    formAbierto.value = false
    limpiarFormulario()
    await cargarTodo()
  } catch (err) {
    error.value = err.response?.data?.error ?? 'No se pudo enviar la solicitud.'
  } finally {
    enviando.value = false
  }
}

function solicitudPendienteBeneficiario(beneficiario) {
  return solicitudesPendientes.value.some(solicitud =>
    solicitud.beneficiario_id === beneficiario.beneficiario_id
  )
}

function beneficiarioVacio() {
  return {
    nombre: '',
    apaterno: '',
    amaterno: '',
    parentesco: '',
    telefono: '',
    direccion: ''
  }
}

function nombreCompleto(beneficiario) {
  return [
    beneficiario.nombre,
    beneficiario.apaterno,
    beneficiario.amaterno
  ].filter(Boolean).join(' ') || 'Sin nombre'
}

function iniciales(beneficiario) {
  return nombreCompleto(beneficiario)
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(parte => parte[0])
    .join('')
    .toUpperCase()
}

function etiquetaTipo(tipo) {
  return {
    crear: 'Alta',
    actualizar: 'Edicion',
    eliminar: 'Baja'
  }[tipo] ?? tipo
}

function estadoClass(estado) {
  return {
    pendiente: 'bg-warning text-dark',
    aprobada: 'bg-success',
    rechazada: 'bg-danger'
  }[estado] ?? 'bg-secondary'
}

onMounted(cargarTodo)
</script>

<template>
  <div class="container py-4">
    <div class="d-flex justify-content-between align-items-start gap-3 flex-wrap mb-4">
      <div>
        <h2 class="fw-bold mb-1" style="color: var(--primary)">Mis beneficiarios</h2>
        <small class="text-muted">{{ beneficiariosFiltrados.length }} beneficiario(s)</small>
      </div>
      <div class="d-flex gap-2 flex-wrap">
        <button class="btn btn-custom" type="button" :disabled="cargando || contratosDisponibles.length === 0" @click="abrirCrear">
          Solicitar alta
        </button>
        <button class="btn btn-outline-secondary" type="button" :disabled="cargando" @click="cargarTodo">
          Actualizar
        </button>
      </div>
    </div>

    <div v-if="error" class="alert alert-warning">{{ error }}</div>
    <div v-if="exito" class="alert alert-success">{{ exito }}</div>

    <div v-if="formAbierto" class="request-panel mb-4">
      <div class="d-flex justify-content-between align-items-start gap-3 mb-3">
        <div>
          <h5 class="fw-bold mb-1">
            Solicitud de {{ etiquetaTipo(form.tipo).toLowerCase() }}
          </h5>
          <small class="text-muted">La solicitud queda pendiente hasta que un administrador la revise.</small>
        </div>
        <button class="btn btn-sm btn-outline-secondary" type="button" @click="cerrarFormulario">Cerrar</button>
      </div>

      <div class="row g-3">
        <div class="col-md-4">
          <label class="form-label">Contrato</label>
          <select v-model="form.contratos_id" class="form-select" :disabled="form.tipo !== 'crear'">
            <option value="">Selecciona un contrato</option>
            <option v-for="contrato in contratosDisponibles" :key="contrato.id" :value="contrato.id">
              {{ contrato.etiqueta }} - {{ contrato.paquete }}
            </option>
          </select>
        </div>

        <template v-if="form.tipo !== 'eliminar'">
          <div class="col-md-4">
            <label class="form-label">Nombre</label>
            <input v-model.trim="form.datos_propuestos.nombre" class="form-control" type="text" />
          </div>
          <div class="col-md-4">
            <label class="form-label">Apellido paterno</label>
            <input v-model.trim="form.datos_propuestos.apaterno" class="form-control" type="text" />
          </div>
          <div class="col-md-4">
            <label class="form-label">Apellido materno</label>
            <input v-model.trim="form.datos_propuestos.amaterno" class="form-control" type="text" />
          </div>
          <div class="col-md-4">
            <label class="form-label">Parentesco</label>
            <input v-model.trim="form.datos_propuestos.parentesco" class="form-control" type="text" />
          </div>
          <div class="col-md-4">
            <label class="form-label">Telefono</label>
            <input v-model.trim="form.datos_propuestos.telefono" class="form-control" type="text" />
          </div>
          <div class="col-12">
            <label class="form-label">Direccion</label>
            <input v-model.trim="form.datos_propuestos.direccion" class="form-control" type="text" />
          </div>
        </template>

        <div class="col-12">
          <label class="form-label">Motivo o comentario</label>
          <textarea v-model.trim="form.motivo_cliente" class="form-control" rows="2"></textarea>
        </div>
      </div>

      <div class="d-flex justify-content-end gap-2 mt-3">
        <button class="btn btn-outline-secondary" type="button" @click="cerrarFormulario">Cancelar</button>
        <button class="btn btn-custom" type="button" :disabled="enviando" @click="enviarSolicitud">
          {{ enviando ? 'Enviando...' : 'Enviar solicitud' }}
        </button>
      </div>
    </div>

    <div v-if="cargando" class="text-center py-5">
      <div class="spinner-border" style="color:var(--secondary)"></div>
      <p class="text-muted mt-2 mb-0">Cargando beneficiarios...</p>
    </div>

    <template v-else>
      <div class="filters-bar mb-4">
        <input
          v-model="busqueda"
          class="form-control filter-input"
          type="text"
          placeholder="Buscar por nombre, parentesco, telefono o contrato"
        />

        <select v-model="filtroContrato" class="form-select filter-select">
          <option value="todos">Todos los contratos</option>
          <option v-for="contrato in contratosDisponibles" :key="contrato.id" :value="contrato.id">
            {{ contrato.etiqueta }}
          </option>
        </select>
      </div>

      <div v-if="beneficiariosFiltrados.length === 0" class="empty-state">
        No hay beneficiarios que coincidan con los filtros.
      </div>

      <div v-else class="beneficiarios-grid">
        <article
          v-for="beneficiario in beneficiariosFiltrados"
          :key="beneficiario.beneficiario_id"
          class="beneficiario-card"
        >
          <div class="beneficiario-card__top">
            <div class="avatar">{{ iniciales(beneficiario) }}</div>
            <div>
              <h5 class="mb-1">{{ nombreCompleto(beneficiario) }}</h5>
              <span class="relationship">{{ beneficiario.parentesco ?? 'Sin parentesco' }}</span>
            </div>
          </div>

          <dl class="beneficiario-data">
            <div>
              <dt>Contrato</dt>
              <dd>{{ beneficiario.num_contrato ?? beneficiario.contratos_id ?? '-' }}</dd>
            </div>
            <div>
              <dt>Paquete</dt>
              <dd>{{ beneficiario.paquete?.nombre ?? '-' }}</dd>
            </div>
            <div>
              <dt>Telefono</dt>
              <dd>{{ beneficiario.telefono ?? '-' }}</dd>
            </div>
            <div>
              <dt>Direccion</dt>
              <dd>{{ beneficiario.direccion ?? '-' }}</dd>
            </div>
          </dl>

          <div class="card-actions">
            <span v-if="solicitudPendienteBeneficiario(beneficiario)" class="pending-note">Solicitud pendiente</span>
            <button
              class="btn btn-sm btn-outline-secondary"
              type="button"
              :disabled="solicitudPendienteBeneficiario(beneficiario)"
              @click="abrirEditar(beneficiario)"
            >
              Solicitar edicion
            </button>
            <button
              class="btn btn-sm btn-outline-danger"
              type="button"
              :disabled="solicitudPendienteBeneficiario(beneficiario)"
              @click="abrirEliminar(beneficiario)"
            >
              Solicitar baja
            </button>
          </div>
        </article>
      </div>

      <section class="requests-section mt-4">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <h5 class="fw-bold mb-0">Solicitudes recientes</h5>
          <span class="text-muted small">{{ solicitudes.length }} solicitud(es)</span>
        </div>

        <div v-if="solicitudes.length === 0" class="empty-state empty-state--small">
          Sin solicitudes registradas.
        </div>

        <div v-else class="requests-list">
          <div v-for="solicitud in solicitudes" :key="solicitud.solicitud_beneficiario_id" class="request-item">
            <div>
              <strong>{{ etiquetaTipo(solicitud.tipo) }}</strong>
              <small class="text-muted d-block">Contrato {{ solicitud.num_contrato ?? solicitud.contratos_id }}</small>
            </div>
            <div class="text-end">
              <span class="badge text-capitalize" :class="estadoClass(solicitud.estado)">{{ solicitud.estado }}</span>
            </div>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.filters-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.filter-input {
  max-width: 390px;
  border-radius: 8px;
}

.filter-select {
  max-width: 240px;
  border-radius: 8px;
}

.request-panel,
.beneficiario-card,
.empty-state,
.requests-section {
  background: #fff;
  border: 1px solid #e7ecef;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(47, 65, 86, 0.06);
}

.request-panel,
.requests-section {
  padding: 18px;
}

.beneficiarios-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
}

.beneficiario-card {
  padding: 18px;
}

.beneficiario-card__top {
  display: flex;
  gap: 12px;
  align-items: center;
  padding-bottom: 14px;
  border-bottom: 1px solid #edf2f4;
}

.avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: var(--secondary);
  color: #fff;
  font-weight: 800;
}

.relationship {
  display: inline-flex;
  border-radius: 999px;
  background: #e8f3ef;
  color: #2f6b54;
  padding: 3px 9px;
  font-size: 0.78rem;
  font-weight: 700;
}

.beneficiario-data {
  display: grid;
  gap: 10px;
  margin: 14px 0 0;
}

.beneficiario-data div {
  display: grid;
  gap: 2px;
}

.beneficiario-data dt {
  color: #667985;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}

.beneficiario-data dd {
  margin: 0;
  color: var(--primary);
  font-weight: 600;
}

.card-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid #edf2f4;
}

.pending-note {
  color: #7a5b08;
  font-size: 0.82rem;
  font-weight: 700;
  width: 100%;
}

.requests-list {
  display: grid;
  gap: 8px;
}

.request-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 1px solid #edf2f4;
}

.request-item:last-child {
  border-bottom: 0;
}

.empty-state {
  padding: 48px 18px;
  text-align: center;
  color: #667985;
}

.empty-state--small {
  padding: 26px 18px;
}

@media (max-width: 768px) {
  .filter-input,
  .filter-select {
    max-width: none;
    width: 100%;
  }
}
</style>
