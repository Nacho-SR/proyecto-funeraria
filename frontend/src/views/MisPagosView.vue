<script setup>
import { computed, onMounted, ref } from 'vue'
import { clienteContratosService } from '@/services/clienteContratos.service'

const pagos = ref([])
const cargando = ref(false)
const error = ref('')
const busqueda = ref('')
const filtroEstatus = ref('todos')
const filtroContrato = ref('todos')

const contratosDisponibles = computed(() => {
  const mapa = new Map()
  pagos.value.forEach(pago => {
    const id = pago.contratos_id ?? pago.contrato_id
    if (!id) return
    mapa.set(id, pago.num_contrato ?? id)
  })

  return [...mapa.entries()].map(([id, etiqueta]) => ({ id, etiqueta }))
})

const pagosFiltrados = computed(() => {
  const q = busqueda.value.trim().toLowerCase()

  return pagos.value.filter(pago => {
    const texto = [
      pago.num_contrato,
      pago.contratos_id,
      pago.paquete?.nombre,
      pago.estatus
    ].filter(Boolean).join(' ').toLowerCase()

    const coincideTexto = !q || texto.includes(q)
    const coincideEstatus = filtroEstatus.value === 'todos' || pago.estatus === filtroEstatus.value
    const coincideContrato = filtroContrato.value === 'todos' || (pago.contratos_id ?? pago.contrato_id) === filtroContrato.value

    return coincideTexto && coincideEstatus && coincideContrato
  })
})

const totalValidado = computed(() =>
  pagos.value
    .filter(pago => pago.estatus === 'validado')
    .reduce((total, pago) => total + Number(pago.monto ?? 0), 0)
)

const totalPorValidar = computed(() =>
  pagos.value
    .filter(pago => pago.estatus === 'por validar')
    .reduce((total, pago) => total + Number(pago.monto ?? 0), 0)
)

async function cargarPagos() {
  cargando.value = true
  error.value = ''

  try {
    const { data } = await clienteContratosService.listarMisPagos()
    pagos.value = data.pagos ?? []
  } catch (err) {
    error.value = err.response?.data?.error ?? 'No se pudieron cargar tus pagos.'
  } finally {
    cargando.value = false
  }
}

function formatoMoneda(valor) {
  return Number(valor ?? 0).toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN'
  })
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

function estatusClass(estatus) {
  return {
    validado: 'bg-success',
    'por validar': 'bg-info text-dark',
    pendiente: 'bg-warning text-dark',
    cancelado: 'bg-secondary',
    rechazado: 'bg-danger'
  }[estatus] ?? 'bg-secondary'
}

onMounted(cargarPagos)
</script>

<template>
  <div class="container py-4">
    <div class="d-flex justify-content-between align-items-start gap-3 flex-wrap mb-4">
      <div>
        <h2 class="fw-bold mb-1" style="color: var(--primary)">Mis pagos</h2>
        <small class="text-muted">{{ pagosFiltrados.length }} pago(s)</small>
      </div>
      <button class="btn btn-outline-secondary" type="button" :disabled="cargando" @click="cargarPagos">
        Actualizar
      </button>
    </div>

    <div v-if="error" class="alert alert-warning">{{ error }}</div>

    <div v-if="cargando" class="text-center py-5">
      <div class="spinner-border" style="color:var(--secondary)"></div>
      <p class="text-muted mt-2 mb-0">Cargando pagos...</p>
    </div>

    <template v-else>
      <div class="summary-grid mb-4">
        <div>
          <span>Total validado</span>
          <strong>{{ formatoMoneda(totalValidado) }}</strong>
        </div>
        <div>
          <span>Por validar</span>
          <strong>{{ formatoMoneda(totalPorValidar) }}</strong>
        </div>
      </div>

      <div class="filters-bar mb-4">
        <input
          v-model="busqueda"
          class="form-control filter-input"
          type="text"
          placeholder="Buscar por contrato, paquete o estatus"
        />

        <select v-model="filtroContrato" class="form-select filter-select">
          <option value="todos">Todos los contratos</option>
          <option v-for="contrato in contratosDisponibles" :key="contrato.id" :value="contrato.id">
            {{ contrato.etiqueta }}
          </option>
        </select>

        <div class="btn-group">
          <button
            v-for="op in [{val:'todos',label:'Todos'},{val:'validado',label:'Validados'},{val:'por validar',label:'Por validar'},{val:'cancelado',label:'Cancelados'}]"
            :key="op.val"
            class="btn btn-filter"
            :class="{ activo: filtroEstatus === op.val }"
            type="button"
            @click="filtroEstatus = op.val"
          >
            {{ op.label }}
          </button>
        </div>
      </div>

      <div v-if="pagosFiltrados.length === 0" class="empty-state">
        No hay pagos que coincidan con los filtros.
      </div>

      <div v-else class="card shadow-sm">
        <div class="table-responsive">
          <table class="table table-hover mb-0 align-middle">
            <thead class="thead-custom">
              <tr>
                <th>Fecha</th>
                <th>Contrato</th>
                <th>Paquete</th>
                <th class="text-end">Monto</th>
                <th>Estatus</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="pago in pagosFiltrados" :key="pago.pagos_id">
                <td>{{ formatoFecha(pago.fecha_pago) }}</td>
                <td class="fw-semibold">{{ pago.num_contrato ?? pago.contratos_id ?? '-' }}</td>
                <td>{{ pago.paquete?.nombre ?? '-' }}</td>
                <td class="text-end fw-semibold">{{ formatoMoneda(pago.monto) }}</td>
                <td>
                  <span class="badge text-capitalize" :class="estatusClass(pago.estatus)">
                    {{ pago.estatus }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.summary-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.summary-grid > div,
.empty-state {
  background: #fff;
  border: 1px solid #e7ecef;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(47, 65, 86, 0.06);
}

.summary-grid > div {
  padding: 16px 18px;
}

.summary-grid span {
  display: block;
  color: #667985;
  font-size: 0.78rem;
  font-weight: 600;
  text-transform: uppercase;
}

.summary-grid strong {
  display: block;
  color: var(--primary);
  font-size: 1.2rem;
}

.filters-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.filter-input {
  max-width: 340px;
  border-radius: 8px;
}

.filter-select {
  max-width: 230px;
  border-radius: 8px;
}

.btn-filter {
  border: 1.5px solid var(--secondary);
  color: var(--secondary);
  background: #fff;
  font-size: 0.85rem;
  padding: 6px 14px;
}

.btn-filter:first-child {
  border-radius: 8px 0 0 8px;
}

.btn-filter:last-child {
  border-radius: 0 8px 8px 0;
}

.btn-filter.activo {
  background: var(--secondary);
  color: #fff;
}

.thead-custom th {
  background: var(--primary);
  color: #fff;
  font-weight: 600;
  padding: 12px 16px;
  white-space: nowrap;
}

.empty-state {
  padding: 48px 18px;
  text-align: center;
  color: #667985;
}

@media (max-width: 768px) {
  .summary-grid,
  .filter-input,
  .filter-select {
    grid-template-columns: 1fr;
    max-width: none;
    width: 100%;
  }

  .btn-group {
    width: 100%;
    overflow-x: auto;
  }
}
</style>
