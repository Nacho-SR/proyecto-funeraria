<script setup>
import { ref, computed, onMounted } from 'vue'
import { Bar, Doughnut, Line } from 'vue-chartjs'
import {
  Chart as ChartJS,
  Title, Tooltip, Legend,
  BarElement, CategoryScale, LinearScale,
  ArcElement, PointElement, LineElement,
} from 'chart.js'
import api from '@/services/api'

ChartJS.register(Title, Tooltip, Legend, BarElement, CategoryScale, LinearScale, ArcElement, PointElement, LineElement)

const cargando = ref(false)
const error = ref('')

const clientes = ref([])
const cobradores = ref([])
const contratos = ref([])
const pagos = ref([])

async function cargarTodo() {
  cargando.value = true
  error.value = ''
  try {
    const [resClientes, resCobradores, resContratos, resPagos] = await Promise.allSettled([
      api.get('/administrativos/clientes-activos'),
      api.get('/administrativos/cobradores-activos'),
      api.get('/administrativos/info-contratos'),
      api.get('/administrativos/pagos'),
    ])

    if (resClientes.status === 'fulfilled') {
      clientes.value = resClientes.value.data?.clientes ?? resClientes.value.data ?? []
    }
    if (resCobradores.status === 'fulfilled') {
      cobradores.value = resCobradores.value.data?.cobradores ?? resCobradores.value.data ?? []
    }
    if (resContratos.status === 'fulfilled') {
      contratos.value = resContratos.value.data?.contratos ?? resContratos.value.data ?? []
    }
    if (resPagos.status === 'fulfilled') {
      pagos.value = resPagos.value.data?.pagos ?? resPagos.value.data ?? []
    }
  } catch {
    error.value = 'Error al cargar la información del dashboard.'
  } finally {
    cargando.value = false
  }
}

const totalClientes = computed(() => clientes.value.length)
const totalCobradores = computed(() => cobradores.value.length)
const totalContratos = computed(() => contratos.value.length)
const estadoContrato = (contrato) => contrato.estado ?? (contrato.activo === false ? 'inactivo' : 'activo')
const contratosActivos = computed(() => contratos.value.filter(c => estadoContrato(c) === 'activo').length)

const totalCobrado = computed(() =>
  pagos.value
    .filter(p => (p.estatus ?? p.estado) === 'validado')
    .reduce((acc, p) => acc + Number(p.monto ?? 0), 0)
)

const totalPendiente = computed(() =>
  pagos.value
    .filter(p => ['por validar', 'pendiente'].includes(p.estatus ?? p.estado))
    .reduce((acc, p) => acc + Number(p.monto ?? 0), 0)
)

const totalPorValidar = computed(() =>
  pagos.value
    .filter(p => (p.estatus ?? p.estado) === 'por validar')
    .reduce((acc, p) => acc + Number(p.monto ?? 0), 0)
)

const chartPagosPorEstatus = computed(() => {
  const counts = { validado: 0, 'por validar': 0, pendiente: 0, cancelado: 0 }
  pagos.value.forEach(p => {
    const e = p.estatus ?? p.estado
    if (counts[e] !== undefined) counts[e]++
  })
  return {
    labels: ['Validado', 'Por validar', 'Pendiente', 'Cancelado'],
    datasets: [{
      data: [counts.validado, counts['por validar'], counts.pendiente, counts.cancelado],
      backgroundColor: ['#28a745', '#17a2b8', '#ffc107', '#6c757d'],
      borderWidth: 0,
    }]
  }
})

const chartContratosPorEstado = computed(() => {
  const counts = { activo: 0, pagado: 0, cancelado: 0, suspendido: 0 }
  contratos.value.forEach(c => {
    const estado = estadoContrato(c)
    if (counts[estado] !== undefined) counts[estado]++
  })
  return {
    labels: ['Activos', 'Pagados', 'Cancelados', 'Suspendidos'],
    datasets: [{
      label: 'Contratos',
      data: [counts.activo, counts.pagado, counts.cancelado, counts.suspendido],
      backgroundColor: ['#567C8D', '#28a745', '#dc3545', '#ffc107'],
      borderRadius: 8,
    }]
  }
})

const chartIngresosMensuales = computed(() => {
  const meses = {}
  pagos.value
    .filter(p => (p.estatus ?? p.estado) === 'validado')
    .forEach(p => {
      const fecha = new Date(p.fechaPago ?? p.fecha_pago)
      if (isNaN(fecha)) return
      const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`
      meses[key] = (meses[key] ?? 0) + Number(p.monto ?? 0)
    })
  const labels = Object.keys(meses).sort()
  const data = labels.map(l => meses[l])
  return {
    labels: labels.map(l => {
      const [y, m] = l.split('-')
      const nombres = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
      return `${nombres[Number(m) - 1]} ${y}`
    }),
    datasets: [{
      label: 'Ingresos',
      data,
      borderColor: '#2F4156',
      backgroundColor: 'rgba(47, 65, 86, 0.1)',
      tension: 0.3,
      fill: true,
    }]
  }
})

const opcionesGenericas = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom' }
  }
}

const ultimosPagos = computed(() => {
  return [...pagos.value]
    .sort((a, b) => new Date(b.fechaPago ?? b.fecha_pago) - new Date(a.fechaPago ?? a.fecha_pago))
    .slice(0, 5)
})

function estatusClass(e) {
  return {
    'validado': 'bg-success',
    'por validar': 'bg-info text-dark',
    'pendiente': 'bg-warning text-dark',
    'cancelado': 'bg-secondary',
  }[e] ?? 'bg-secondary'
}

onMounted(cargarTodo)
</script>

<template>
  <div class="container py-4">
    <div class="mb-4">
      <h3 class="mb-0 fw-bold" style="color: var(--primary)">Dashboard</h3>
      <small class="text-muted">Resumen general del sistema</small>
    </div>

    <div v-if="error" class="alert alert-warning">{{ error }}</div>

    <div v-if="cargando" class="text-center py-5">
      <div class="spinner-border" style="color: var(--secondary)"></div>
      <p class="mt-2 text-muted">Cargando datos...</p>
    </div>

    <div v-else>
      <div class="row g-3 mb-4">
        <div class="col-md-3">
          <div class="kpi-card kpi-clientes">
            <div class="kpi-icon">👥</div>
            <div>
              <div class="kpi-label">Clientes</div>
              <div class="kpi-value">{{ totalClientes }}</div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="kpi-card kpi-cobradores">
            <div class="kpi-icon">💼</div>
            <div>
              <div class="kpi-label">Cobradores</div>
              <div class="kpi-value">{{ totalCobradores }}</div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="kpi-card kpi-contratos">
            <div class="kpi-icon">📄</div>
            <div>
              <div class="kpi-label">Contratos activos</div>
              <div class="kpi-value">{{ contratosActivos }} / {{ totalContratos }}</div>
            </div>
          </div>
        </div>
        <div class="col-md-3">
          <div class="kpi-card kpi-cobrado">
            <div class="kpi-icon">💰</div>
            <div>
              <div class="kpi-label">Total cobrado</div>
              <div class="kpi-value">${{ totalCobrado.toLocaleString('es-MX') }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="row g-3 mb-4">
        <div class="col-md-6">
          <div class="resumen-card resumen-pendiente">
            <div>
              <div class="resumen-label">Pendiente de cobro</div>
              <div class="resumen-value">${{ totalPendiente.toLocaleString('es-MX') }}</div>
            </div>
            <div class="resumen-icon">⏳</div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="resumen-card resumen-vencido">
            <div>
              <div class="resumen-label">Por validar</div>
              <div class="resumen-value">${{ totalPorValidar.toLocaleString('es-MX') }}</div>
            </div>
            <div class="resumen-icon">⚠️</div>
          </div>
        </div>
      </div>

      <div class="row g-3 mb-4">
        <div class="col-md-6">
          <div class="card shadow-sm chart-card">
            <h6 class="chart-title">Pagos por estatus</h6>
            <div class="chart-container">
              <Doughnut :data="chartPagosPorEstatus" :options="opcionesGenericas" />
            </div>
          </div>
        </div>
        <div class="col-md-6">
          <div class="card shadow-sm chart-card">
            <h6 class="chart-title">Contratos por estado</h6>
            <div class="chart-container">
              <Bar :data="chartContratosPorEstado" :options="opcionesGenericas" />
            </div>
          </div>
        </div>
      </div>

      <div class="row g-3 mb-4">
        <div class="col-12">
          <div class="card shadow-sm chart-card">
            <h6 class="chart-title">Ingresos mensuales</h6>
            <div class="chart-container" style="height: 300px">
              <Line :data="chartIngresosMensuales" :options="opcionesGenericas" />
            </div>
          </div>
        </div>
      </div>

      <div class="card shadow-sm">
        <div class="p-3 border-bottom">
          <h6 class="mb-0 fw-bold" style="color: var(--primary)">Últimos pagos registrados</h6>
        </div>
        <div class="table-responsive">
          <table class="table table-hover mb-0">
            <thead class="thead-custom">
              <tr>
                <th>Contrato</th>
                <th>Cliente</th>
                <th>Monto</th>
                <th>Fecha</th>
                <th>Estatus</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="ultimosPagos.length === 0">
                <td colspan="5" class="text-center text-muted py-4">Sin pagos registrados</td>
              </tr>
              <tr v-for="p in ultimosPagos" :key="p.pagoID ?? p.id">
                <td class="fw-semibold">{{ p.contratoID ?? p.contrato_id ?? '—' }}</td>
                <td>{{ p.cliente ?? '—' }}</td>
                <td class="fw-semibold">${{ Number(p.monto ?? 0).toLocaleString('es-MX') }}</td>
                <td>{{ (p.fechaPago ?? p.fecha_pago) ? new Date(p.fechaPago ?? p.fecha_pago).toLocaleDateString('es-MX') : '—' }}</td>
                <td>
                  <span class="badge text-capitalize" :class="estatusClass(p.estatus ?? p.estado)">
                    {{ p.estatus ?? p.estado }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.kpi-card {
  background: #fff;
  border-radius: 14px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  border-left: 4px solid var(--secondary);
}
.kpi-clientes { border-left-color: #2F4156; }
.kpi-cobradores { border-left-color: #567C8D; }
.kpi-contratos { border-left-color: #28a745; }
.kpi-cobrado { border-left-color: #ffc107; }
.kpi-icon {
  font-size: 2rem;
  width: 50px; height: 50px;
  display: flex; align-items: center; justify-content: center;
  background: #f5f5f5; border-radius: 12px;
}
.kpi-label { font-size: 0.85rem; color: #777; }
.kpi-value { font-size: 1.5rem; font-weight: 700; color: var(--primary); }

.resumen-card {
  background: #fff;
  border-radius: 14px;
  padding: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}
.resumen-pendiente { background: linear-gradient(135deg, #fff8e1, #fff); }
.resumen-vencido { background: linear-gradient(135deg, #ffebee, #fff); }
.resumen-label { font-size: 0.9rem; color: #666; margin-bottom: 4px; }
.resumen-value { font-size: 1.8rem; font-weight: 700; color: var(--primary); }
.resumen-icon { font-size: 2.5rem; opacity: 0.5; }

.chart-card {
  padding: 20px;
  border-radius: 14px;
}
.chart-title {
  font-weight: 600;
  color: var(--primary);
  margin-bottom: 16px;
}
.chart-container {
  position: relative;
  height: 250px;
}

.thead-custom th {
  background: var(--primary);
  color: #fff;
  font-weight: 600;
  padding: 12px 16px;
}
</style>
