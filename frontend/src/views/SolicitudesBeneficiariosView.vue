<script setup>
import { computed, onMounted, ref } from 'vue'
import { solicitudesBeneficiariosAdminService } from '@/services/solicitudesBeneficiariosAdmin.service'

const solicitudes = ref([])
const seleccionada = ref(null)
const cargando = ref(false)
const resolviendo = ref(false)
const error = ref('')
const exito = ref('')
const filtroEstado = ref('pendiente')
const filtroTipo = ref('todos')
const busqueda = ref('')
const comentarioAdmin = ref('')

const solicitudesFiltradas = computed(() => {
  const q = busqueda.value.trim().toLowerCase()

  return solicitudes.value.filter(solicitud => {
    const texto = [
      solicitud.num_contrato,
      solicitud.contrato?.num_contrato,
      nombreCliente(solicitud),
      solicitud.tipo,
      solicitud.estado,
      nombreBeneficiario(solicitud.datos_actuales),
      nombreBeneficiario(solicitud.datos_propuestos)
    ].filter(Boolean).join(' ').toLowerCase()

    const coincideTexto = !q || texto.includes(q)
    const coincideEstado = filtroEstado.value === 'todos' || solicitud.estado === filtroEstado.value
    const coincideTipo = filtroTipo.value === 'todos' || solicitud.tipo === filtroTipo.value

    return coincideTexto && coincideEstado && coincideTipo
  })
})

const pendientes = computed(() => solicitudes.value.filter(solicitud => solicitud.estado === 'pendiente').length)

async function cargarSolicitudes() {
  cargando.value = true
  error.value = ''

  try {
    const { data } = await solicitudesBeneficiariosAdminService.listar()
    solicitudes.value = data.solicitudes ?? []
    if (seleccionada.value) {
      seleccionada.value = solicitudes.value.find(s => s.solicitud_beneficiario_id === seleccionada.value.solicitud_beneficiario_id) ?? null
    }
  } catch (err) {
    error.value = err.response?.data?.error ?? 'No se pudieron cargar las solicitudes.'
  } finally {
    cargando.value = false
  }
}

function seleccionar(solicitud) {
  seleccionada.value = solicitud
  comentarioAdmin.value = ''
  error.value = ''
  exito.value = ''
}

async function resolver(accion) {
  if (!seleccionada.value) return

  resolviendo.value = true
  error.value = ''
  exito.value = ''

  try {
    const { data } = await solicitudesBeneficiariosAdminService.resolver(
      seleccionada.value.solicitud_beneficiario_id,
      {
        accion,
        comentario_admin: comentarioAdmin.value
      }
    )

    solicitudes.value = data.solicitudes ?? solicitudes.value
    seleccionada.value = solicitudes.value.find(s => s.solicitud_beneficiario_id === seleccionada.value.solicitud_beneficiario_id) ?? null
    exito.value = accion === 'aprobar' ? 'Solicitud aprobada y aplicada.' : 'Solicitud rechazada.'
    comentarioAdmin.value = ''
  } catch (err) {
    error.value = err.response?.data?.error ?? 'No se pudo resolver la solicitud.'
  } finally {
    resolviendo.value = false
  }
}

function nombreCliente(solicitud) {
  const usuario = solicitud.cliente?.usuario
  return [usuario?.nombre, usuario?.apaterno, usuario?.amaterno].filter(Boolean).join(' ') || 'Cliente sin nombre'
}

function nombreBeneficiario(datos) {
  if (!datos) return ''
  return [datos.nombre, datos.apaterno, datos.amaterno].filter(Boolean).join(' ')
}

function tipoLabel(tipo) {
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

function tipoClass(tipo) {
  return {
    crear: 'bg-info text-dark',
    actualizar: 'bg-primary',
    eliminar: 'bg-danger'
  }[tipo] ?? 'bg-secondary'
}

function formatoFecha(fecha) {
  const valor = fechaValor(fecha)
  return valor ? valor.toLocaleDateString('es-MX') : '-'
}

function fechaValor(fecha) {
  if (!fecha) return null
  if (typeof fecha.toDate === 'function') return fecha.toDate()
  if (fecha.seconds || fecha._seconds) return new Date((fecha.seconds ?? fecha._seconds) * 1000)
  const parsed = new Date(fecha)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function camposBeneficiario(datos) {
  if (!datos) return []
  return [
    ['Nombre', nombreBeneficiario(datos) || '-'],
    ['Parentesco', datos.parentesco ?? '-'],
    ['Telefono', datos.telefono ?? '-'],
    ['Direccion', datos.direccion ?? '-']
  ]
}

onMounted(cargarSolicitudes)
</script>

<template>
  <div class="container py-4">
    <div class="d-flex justify-content-between align-items-start gap-3 flex-wrap mb-4">
      <div>
        <h2 class="fw-bold mb-1" style="color: var(--primary)">Solicitudes de beneficiarios</h2>
        <small class="text-muted">{{ pendientes }} pendiente(s) por revisar</small>
      </div>
      <button class="btn btn-outline-secondary" type="button" :disabled="cargando" @click="cargarSolicitudes">
        Actualizar
      </button>
    </div>

    <div v-if="error" class="alert alert-warning">{{ error }}</div>
    <div v-if="exito" class="alert alert-success">{{ exito }}</div>

    <div class="filters-bar mb-4">
      <input
        v-model="busqueda"
        class="form-control filter-input"
        type="text"
        placeholder="Buscar por cliente, contrato o beneficiario"
      />

      <div class="btn-group">
        <button
          v-for="op in [{val:'todos',label:'Todas'},{val:'pendiente',label:'Pendientes'},{val:'aprobada',label:'Aprobadas'},{val:'rechazada',label:'Rechazadas'}]"
          :key="op.val"
          class="btn btn-filter"
          :class="{ activo: filtroEstado === op.val }"
          type="button"
          @click="filtroEstado = op.val"
        >
          {{ op.label }}
        </button>
      </div>

      <select v-model="filtroTipo" class="form-select filter-select">
        <option value="todos">Todos los tipos</option>
        <option value="crear">Alta</option>
        <option value="actualizar">Edicion</option>
        <option value="eliminar">Baja</option>
      </select>
    </div>

    <div v-if="cargando" class="text-center py-5">
      <div class="spinner-border" style="color:var(--secondary)"></div>
      <p class="text-muted mt-2 mb-0">Cargando solicitudes...</p>
    </div>

    <div v-else class="review-layout">
      <section class="requests-list" aria-label="Solicitudes">
        <div v-if="solicitudesFiltradas.length === 0" class="empty-state">
          No hay solicitudes que coincidan con los filtros.
        </div>

        <button
          v-for="solicitud in solicitudesFiltradas"
          :key="solicitud.solicitud_beneficiario_id"
          type="button"
          class="request-card"
          :class="{ activa: seleccionada?.solicitud_beneficiario_id === solicitud.solicitud_beneficiario_id }"
          @click="seleccionar(solicitud)"
        >
          <div class="d-flex justify-content-between gap-2 align-items-start">
            <div>
              <strong>{{ nombreCliente(solicitud) }}</strong>
              <small class="text-muted d-block">Contrato {{ solicitud.contrato?.num_contrato ?? solicitud.num_contrato ?? solicitud.contratos_id }}</small>
            </div>
            <span class="badge text-capitalize" :class="estadoClass(solicitud.estado)">{{ solicitud.estado }}</span>
          </div>
          <div class="request-card__meta">
            <span class="badge" :class="tipoClass(solicitud.tipo)">{{ tipoLabel(solicitud.tipo) }}</span>
            <small>{{ formatoFecha(solicitud.fecha_creacion) }}</small>
          </div>
        </button>
      </section>

      <section class="detail-panel" aria-label="Detalle de solicitud">
        <div v-if="!seleccionada" class="empty-state">
          Selecciona una solicitud para revisar el detalle.
        </div>

        <template v-else>
          <div class="detail-header">
            <div>
              <span class="eyebrow">Solicitud</span>
              <h4 class="fw-bold mb-0">{{ tipoLabel(seleccionada.tipo) }} de beneficiario</h4>
              <small class="text-muted">Contrato {{ seleccionada.contrato?.num_contrato ?? seleccionada.num_contrato ?? seleccionada.contratos_id }}</small>
            </div>
            <span class="badge text-capitalize" :class="estadoClass(seleccionada.estado)">{{ seleccionada.estado }}</span>
          </div>

          <div class="info-row">
            <span>Cliente</span>
            <strong>{{ nombreCliente(seleccionada) }}</strong>
          </div>

          <div v-if="seleccionada.motivo_cliente" class="detail-section">
            <h6>Comentario del cliente</h6>
            <p class="mb-0">{{ seleccionada.motivo_cliente }}</p>
          </div>

          <div class="compare-grid">
            <div class="compare-box">
              <h6>Datos actuales</h6>
              <dl v-if="seleccionada.datos_actuales">
                <div v-for="[label, value] in camposBeneficiario(seleccionada.datos_actuales)" :key="label">
                  <dt>{{ label }}</dt>
                  <dd>{{ value }}</dd>
                </div>
              </dl>
              <p v-else class="text-muted mb-0">No aplica para alta.</p>
            </div>

            <div class="compare-box">
              <h6>Datos propuestos</h6>
              <dl v-if="seleccionada.datos_propuestos">
                <div v-for="[label, value] in camposBeneficiario(seleccionada.datos_propuestos)" :key="label">
                  <dt>{{ label }}</dt>
                  <dd>{{ value }}</dd>
                </div>
              </dl>
              <p v-else class="text-muted mb-0">La solicitud dara de baja al beneficiario actual.</p>
            </div>
          </div>

          <div v-if="seleccionada.estado === 'pendiente'" class="resolution-box">
            <label class="form-label">Comentario del administrador</label>
            <textarea v-model.trim="comentarioAdmin" class="form-control" rows="3"></textarea>
            <div class="d-flex justify-content-end gap-2 mt-3">
              <button class="btn btn-outline-danger" type="button" :disabled="resolviendo" @click="resolver('rechazar')">
                Rechazar
              </button>
              <button class="btn btn-custom" type="button" :disabled="resolviendo" @click="resolver('aprobar')">
                {{ resolviendo ? 'Resolviendo...' : 'Aprobar y aplicar' }}
              </button>
            </div>
          </div>

          <div v-else class="resolution-box">
            <span class="eyebrow">Resolucion</span>
            <p class="mb-0">{{ seleccionada.comentario_admin || 'Sin comentario del administrador.' }}</p>
          </div>
        </template>
      </section>
    </div>
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
  max-width: 360px;
  border-radius: 8px;
}

.filter-select {
  max-width: 190px;
  border-radius: 8px;
}

.btn-filter {
  border: 1.5px solid var(--secondary);
  color: var(--secondary);
  background: #fff;
  font-size: 0.85rem;
  padding: 6px 14px;
}

.btn-filter.activo {
  background: var(--secondary);
  color: #fff;
}

.review-layout {
  display: grid;
  grid-template-columns: minmax(280px, 390px) minmax(0, 1fr);
  gap: 18px;
  align-items: start;
}

.requests-list {
  display: grid;
  gap: 10px;
}

.request-card,
.detail-panel,
.empty-state {
  background: #fff;
  border: 1px solid #e7ecef;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(47, 65, 86, 0.06);
}

.request-card {
  width: 100%;
  text-align: left;
  padding: 14px;
  transition: border-color 0.18s, box-shadow 0.18s;
}

.request-card:hover,
.request-card.activa {
  border-color: var(--secondary);
  box-shadow: 0 6px 18px rgba(47, 65, 86, 0.12);
}

.request-card__meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
  color: #667985;
}

.detail-panel {
  padding: 20px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  padding-bottom: 16px;
  border-bottom: 1px solid #edf2f4;
}

.eyebrow,
.info-row span {
  display: block;
  color: #667985;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}

.info-row {
  padding: 14px 0;
  border-bottom: 1px solid #edf2f4;
}

.info-row strong {
  color: var(--primary);
}

.detail-section {
  padding-top: 16px;
}

.detail-section h6,
.compare-box h6 {
  color: var(--primary);
  font-weight: 700;
}

.compare-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 16px;
}

.compare-box {
  border: 1px solid #edf2f4;
  border-radius: 8px;
  padding: 14px;
}

.compare-box dl {
  display: grid;
  gap: 8px;
  margin: 0;
}

.compare-box dt {
  color: #667985;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}

.compare-box dd {
  margin: 0;
  color: var(--primary);
  font-weight: 600;
}

.resolution-box {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #edf2f4;
}

.empty-state {
  padding: 42px 18px;
  text-align: center;
  color: #667985;
}

@media (max-width: 992px) {
  .review-layout,
  .compare-grid {
    grid-template-columns: 1fr;
  }

  .filter-input,
  .filter-select {
    max-width: none;
    width: 100%;
  }
}
</style>
