<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'

const todos = ref([])
const cargando = ref(false)
const error = ref('')
const busqueda = ref('')
const filtroFrecuencia = ref('todos')
const filtroEstado = ref('todos')

function contratoId(contrato) {
  return contrato.contratos_id ?? contrato.id ?? ''
}

function nombreCliente(contrato) {
  const usuario = contrato.cliente?.usuario
  const nombre = [usuario?.nombre, usuario?.apaterno, usuario?.amaterno].filter(Boolean).join(' ')
  return nombre || 'Sin cliente'
}

function nombrePaquete(contrato) {
  return contrato.paquete?.nombre ?? 'Sin paquete'
}

function estadoContrato(contrato) {
  if (contrato.estado) return contrato.estado
  return contrato.activo === false ? 'inactivo' : 'activo'
}

function saldoPendiente(contrato) {
  const precio = Number(contrato.precio_final ?? 0)
  const abonado = Number(contrato.abonado ?? 0)
  return Math.max(precio - abonado, 0)
}

function fechaValor(fecha) {
  if (!fecha) return null
  if (typeof fecha.toDate === 'function') return fecha.toDate()
  if (fecha.seconds || fecha._seconds) return new Date((fecha.seconds ?? fecha._seconds) * 1000)
  const parsed = new Date(fecha)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function formatoFecha(fecha) {
  const valor = fechaValor(fecha)
  return valor ? valor.toLocaleDateString('es-MX') : '-'
}

function formatoMoneda(valor) {
  return Number(valor ?? 0).toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN'
  })
}

async function cargar() {
  cargando.value = true
  error.value = ''
  try {
    const { data } = await api.get('/administrativos/info-contratos')
    todos.value = Array.isArray(data) ? data : data.contratos ?? []
  } catch (err) {
    error.value = err.response?.data?.error ?? 'No se pudieron cargar los contratos.'
  } finally {
    cargando.value = false
  }
}

const filtrados = computed(() => {
  let lista = todos.value
  const q = busqueda.value.toLowerCase().trim()

  if (q) {
    lista = lista.filter(contrato => {
      const texto = [
        contrato.num_contrato,
        contratoId(contrato),
        nombreCliente(contrato),
        nombrePaquete(contrato),
        contrato.direccion_cobro?.calle,
        contrato.direccion_cobro?.colonia
      ].filter(Boolean).join(' ').toLowerCase()

      return texto.includes(q)
    })
  }

  if (filtroFrecuencia.value !== 'todos') {
    lista = lista.filter(contrato => contrato.frecuencia_pago === filtroFrecuencia.value)
  }

  if (filtroEstado.value !== 'todos') {
    lista = lista.filter(contrato => estadoContrato(contrato) === filtroEstado.value)
  }

  return lista
})

const frecuenciaClass = (frecuencia) => ({
  semanal: 'bg-info text-dark',
  quincenal: 'bg-warning text-dark',
  mensual: 'bg-primary'
}[frecuencia] ?? 'bg-secondary')

const estadoClass = (estado) => ({
  activo: 'badge-activo',
  pagado: 'bg-success',
  cancelado: 'bg-danger',
  suspendido: 'bg-warning text-dark',
  inactivo: 'bg-secondary'
}[estado] ?? 'bg-secondary')

onMounted(cargar)
</script>

<template>
  <div class="container py-4">
    <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
      <div>
        <h3 class="mb-0 fw-bold" style="color: var(--primary)">Contratos</h3>
        <small class="text-muted">{{ filtrados.length }} resultado(s)</small>
      </div>
      <router-link to="/alta-contrato" class="btn btn-custom">+ Nuevo contrato</router-link>
    </div>

    <div class="filtros-bar mb-4">
      <input
        v-model="busqueda"
        type="text"
        class="form-control filtro-input"
        placeholder="Buscar por contrato, cliente, paquete o direccion"
      />

      <div class="btn-group">
        <button
          v-for="op in [{val:'todos',label:'Todos'},{val:'semanal',label:'Semanal'},{val:'quincenal',label:'Quincenal'},{val:'mensual',label:'Mensual'}]"
          :key="op.val"
          class="btn btn-filtro"
          :class="{ activo: filtroFrecuencia === op.val }"
          @click="filtroFrecuencia = op.val"
        >
          {{ op.label }}
        </button>
      </div>

      <div class="btn-group">
        <button
          v-for="op in [{val:'todos',label:'Todos'},{val:'activo',label:'Activos'},{val:'pagado',label:'Pagados'},{val:'suspendido',label:'Suspendidos'},{val:'cancelado',label:'Cancelados'}]"
          :key="op.val"
          class="btn btn-filtro"
          :class="{ activo: filtroEstado === op.val }"
          @click="filtroEstado = op.val"
        >
          {{ op.label }}
        </button>
      </div>
    </div>

    <div v-if="error" class="alert alert-warning">{{ error }}</div>

    <div v-if="cargando" class="text-center py-5">
      <div class="spinner-border" style="color:var(--secondary)"></div>
    </div>

    <div v-else-if="filtrados.length === 0 && !error" class="sin-datos">Sin contratos registrados.</div>

    <div v-else-if="filtrados.length > 0" class="card shadow-sm">
      <div class="table-responsive">
        <table class="table table-hover mb-0 align-middle">
          <thead class="thead-custom">
            <tr>
              <th>No. contrato</th>
              <th>Cliente</th>
              <th>Paquete</th>
              <th>Fecha inicio</th>
              <th>Frecuencia</th>
              <th class="text-end">Precio</th>
              <th class="text-end">Abonado</th>
              <th class="text-end">Saldo</th>
              <th>Estado</th>
              <th class="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="contrato in filtrados"
              :key="contratoId(contrato)"
              :class="{ 'fila-inactiva': ['cancelado', 'suspendido', 'inactivo'].includes(estadoContrato(contrato)) }"
            >
              <td class="fw-semibold">{{ contrato.num_contrato ?? contratoId(contrato) ?? '-' }}</td>
              <td>
                <div class="fw-semibold">{{ nombreCliente(contrato) }}</div>
                <small class="text-muted">{{ contrato.cliente?.cliente?.telefono ?? '-' }}</small>
              </td>
              <td>{{ nombrePaquete(contrato) }}</td>
              <td>{{ formatoFecha(contrato.fecha_inicio) }}</td>
              <td>
                <span class="badge text-capitalize" :class="frecuenciaClass(contrato.frecuencia_pago)">
                  {{ contrato.frecuencia_pago ?? '-' }}
                </span>
              </td>
              <td class="text-end">{{ formatoMoneda(contrato.precio_final) }}</td>
              <td class="text-end">{{ formatoMoneda(contrato.abonado) }}</td>
              <td class="text-end fw-semibold">{{ formatoMoneda(saldoPendiente(contrato)) }}</td>
              <td>
                <span class="badge text-capitalize" :class="estadoClass(estadoContrato(contrato))">
                  {{ estadoContrato(contrato) }}
                </span>
              </td>
              <td class="text-end">
                <router-link
                  v-if="estadoContrato(contrato) === 'activo'"
                  to="/baja-contrato"
                  class="btn btn-sm btn-outline-danger"
                >
                  Baja
                </router-link>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<style scoped>
.filtros-bar { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
.filtro-input { max-width: 360px; border-radius: 10px; }
.btn-filtro { border: 1.5px solid var(--secondary); color: var(--secondary); background: #fff; font-size: 0.85rem; padding: 6px 14px; transition: all 0.2s; }
.btn-filtro:first-child { border-radius: 10px 0 0 10px; }
.btn-filtro:last-child { border-radius: 0 10px 10px 0; }
.btn-filtro.activo { background: var(--secondary); color: #fff; }
.thead-custom th { background: var(--primary); color: #fff; font-weight: 600; padding: 12px 16px; white-space: nowrap; }
.fila-inactiva td { opacity: 0.62; }
.badge-activo { background-color: var(--secondary); }
.sin-datos { background: #fff; border-radius: 14px; padding: 60px; text-align: center; color: #777; }
</style>
