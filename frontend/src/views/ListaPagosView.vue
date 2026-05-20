<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'

const todos = ref([])
const cargando = ref(false)
const error = ref('')
const busqueda = ref('')
const filtroEstado = ref('todos')
const fechaDesde = ref('')
const fechaHasta = ref('')

async function cargar() {
  cargando.value = true
  error.value = ''
  try {
    const { data } = await api.get('/administrativos/pagos')
    todos.value = Array.isArray(data) ? data : data.pagos ?? []
  } catch {
    error.value = 'No se pudieron cargar los pagos.'
  } finally {
    cargando.value = false
  }
}

const filtrados = computed(() => {
  let lista = todos.value
  const q = busqueda.value.toLowerCase().trim()
  if (q) {
    lista = lista.filter(p =>
      (p.contrato_id ?? '').toLowerCase().includes(q) ||
      (p.cliente ?? '').toLowerCase().includes(q)
    )
  }
  if (filtroEstado.value === 'pagados') lista = lista.filter(p => p.estado === 'pagado')
  else if (filtroEstado.value === 'pendientes') lista = lista.filter(p => p.estado === 'pendiente')
  else if (filtroEstado.value === 'vencidos') lista = lista.filter(p => p.estado === 'vencido')

  if (fechaDesde.value) lista = lista.filter(p => new Date(p.fecha_pago) >= new Date(fechaDesde.value))
  if (fechaHasta.value) lista = lista.filter(p => new Date(p.fecha_pago) <= new Date(fechaHasta.value))

  return lista
})

const estadoClass = (e) => ({ 'pagado': 'bg-success', 'pendiente': 'bg-warning text-dark', 'vencido': 'bg-danger' }[e] ?? 'bg-secondary')

const totalFiltrado = computed(() =>
  filtrados.value.filter(p => p.estado === 'pagado').reduce((acc, p) => acc + Number(p.monto ?? 0), 0)
)

onMounted(cargar)
</script>

<template>
  <div class="container py-4">
    <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
      <div>
        <h3 class="mb-0 fw-bold" style="color: var(--primary)">Pagos</h3>
        <small class="text-muted">{{ filtrados.length }} resultado(s)</small>
      </div>
      <div class="total-badge">
        Total cobrado: <strong>${{ totalFiltrado.toLocaleString('es-MX') }}</strong>
      </div>
    </div>

    <div class="filtros-bar mb-4">
      <input v-model="busqueda" type="text" class="form-control filtro-input" placeholder="🔍 Buscar por contrato o cliente…" />
      <div class="btn-group">
        <button v-for="op in [{val:'todos',label:'Todos'},{val:'pagados',label:'Pagados'},{val:'pendientes',label:'Pendientes'},{val:'vencidos',label:'Vencidos'}]"
          :key="op.val" class="btn btn-filtro" :class="{ activo: filtroEstado === op.val }" @click="filtroEstado = op.val">
          {{ op.label }}
        </button>
      </div>
    </div>

    <div class="filtros-bar mb-4">
      <div class="d-flex align-items-center gap-2">
        <label class="text-muted small mb-0">Desde:</label>
        <input v-model="fechaDesde" type="date" class="form-control filtro-fecha" />
      </div>
      <div class="d-flex align-items-center gap-2">
        <label class="text-muted small mb-0">Hasta:</label>
        <input v-model="fechaHasta" type="date" class="form-control filtro-fecha" />
      </div>
      <button class="btn btn-outline-secondary btn-sm" @click="fechaDesde = ''; fechaHasta = ''">Limpiar fechas</button>
    </div>

    <div v-if="error" class="alert alert-warning">
      {{ error }} <small class="d-block text-muted">El endpoint de pagos puede no estar implementado aún en el backend.</small>
    </div>

    <div v-if="cargando" class="text-center py-5">
      <div class="spinner-border" style="color:var(--secondary)"></div>
    </div>

    <div v-else-if="filtrados.length === 0 && !error" class="sin-datos">Sin pagos registrados.</div>

    <div v-else-if="filtrados.length > 0" class="card shadow-sm">
      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead class="thead-custom">
            <tr>
              <th>Contrato ID</th>
              <th>Cliente</th>
              <th>Monto</th>
              <th>Fecha pago</th>
              <th>Cobrador</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in filtrados" :key="p.id ?? p.pago_id">
              <td class="fw-semibold">{{ p.contrato_id ?? '—' }}</td>
              <td>{{ p.cliente ?? '—' }}</td>
              <td class="fw-semibold">${{ Number(p.monto ?? 0).toLocaleString('es-MX') }}</td>
              <td>{{ p.fecha_pago ? new Date(p.fecha_pago).toLocaleDateString('es-MX') : '—' }}</td>
              <td>{{ p.cobrador ?? '—' }}</td>
              <td>
                <span class="badge text-capitalize" :class="estadoClass(p.estado)">{{ p.estado }}</span>
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
.filtro-input { max-width: 300px; border-radius: 10px; }
.filtro-fecha { max-width: 160px; border-radius: 10px; }
.btn-filtro { border: 1.5px solid var(--secondary); color: var(--secondary); background: #fff; font-size: 0.85rem; padding: 6px 14px; transition: all 0.2s; }
.btn-filtro:first-child { border-radius: 10px 0 0 10px; }
.btn-filtro:last-child { border-radius: 0 10px 10px 0; }
.btn-filtro.activo { background: var(--secondary); color: #fff; }
.thead-custom th { background: var(--primary); color: #fff; font-weight: 600; padding: 12px 16px; }
.sin-datos { background: #fff; border-radius: 14px; padding: 60px; text-align: center; color: #aaa; }
.total-badge { background: var(--primary); color: #fff; padding: 8px 18px; border-radius: 10px; font-size: 0.9rem; }
</style>
