<script setup>
import { ref, computed, onMounted } from 'vue'
import { pagoService } from '@/services/pago.service'
import { useRouter } from 'vue-router'

const router = useRouter()

const pagos = ref([])
const cargando = ref(false)
const error = ref('')

const busqueda = ref('')
const filtroEstatus = ref('todos')
const fechaDesde = ref('')
const fechaHasta = ref('')

const pagoDetalle = ref(null)
const modalDetalle = ref(false)

async function cargar() {
  cargando.value = true
  error.value = ''
  try {
    const { data } = await pagoService.listar()
    pagos.value = Array.isArray(data) ? data : data.pagos ?? []
  } catch {
    error.value = 'No se pudieron cargar los pagos.'
  } finally {
    cargando.value = false
  }
}

const filtrados = computed(() => {
  let lista = pagos.value
  const q = busqueda.value.toLowerCase().trim()

  if (q) {
    lista = lista.filter(p =>
      String(p.contratoID ?? p.contrato_id ?? '').toLowerCase().includes(q) ||
      String(p.cliente ?? '').toLowerCase().includes(q)
    )
  }

  if (filtroEstatus.value !== 'todos') {
    lista = lista.filter(p => (p.estatus ?? p.estado) === filtroEstatus.value)
  }

  if (fechaDesde.value) {
    lista = lista.filter(p => new Date(p.fechaPago ?? p.fecha_pago) >= new Date(fechaDesde.value))
  }
  if (fechaHasta.value) {
    lista = lista.filter(p => new Date(p.fechaPago ?? p.fecha_pago) <= new Date(fechaHasta.value))
  }

  return lista
})

const totales = computed(() => {
  const t = { pagado: 0, pendiente: 0, vencido: 0, cancelado: 0 }
  filtrados.value.forEach(p => {
    const estatus = p.estatus ?? p.estado
    const monto = Number(p.monto ?? 0)
    if (t[estatus] !== undefined) t[estatus] += monto
  })
  return t
})

const totalGeneral = computed(() =>
  filtrados.value.reduce((acc, p) => acc + Number(p.monto ?? 0), 0)
)

function estatusClass(e) {
  return {
    'pagado': 'bg-success',
    'pendiente': 'bg-warning text-dark',
    'vencido': 'bg-danger',
    'cancelado': 'bg-secondary',
  }[e] ?? 'bg-secondary'
}

function verDetalle(pago) {
  pagoDetalle.value = pago
  modalDetalle.value = true
}

function limpiarFiltros() {
  busqueda.value = ''
  filtroEstatus.value = 'todos'
  fechaDesde.value = ''
  fechaHasta.value = ''
}

function irCaptura() {
  router.push({ name: 'captura-pago' })
}

function irValidacion() {
  router.push({ name: 'validacion-cobros' })
}

onMounted(cargar)
</script>

<template>
  <div class="container py-4">
    <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
      <div>
        <h3 class="mb-0 fw-bold" style="color: var(--primary)">Módulo de pagos</h3>
        <small class="text-muted">Gestión integral de pagos del sistema</small>
      </div>
      <div class="d-flex gap-2">
        <button class="btn btn-outline-secondary" @click="irValidacion">
          Validar cobros
        </button>
        <button class="btn btn-custom" @click="irCaptura">
          + Registrar pago
        </button>
      </div>
    </div>

    <div class="row g-3 mb-4">
      <div class="col-md-3">
        <div class="card-resumen card-pagado">
          <div class="resumen-label">Cobrado</div>
          <div class="resumen-monto">${{ totales.pagado.toLocaleString('es-MX') }}</div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card-resumen card-pendiente">
          <div class="resumen-label">Pendiente</div>
          <div class="resumen-monto">${{ totales.pendiente.toLocaleString('es-MX') }}</div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card-resumen card-vencido">
          <div class="resumen-label">Vencido</div>
          <div class="resumen-monto">${{ totales.vencido.toLocaleString('es-MX') }}</div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card-resumen card-total">
          <div class="resumen-label">Total</div>
          <div class="resumen-monto">${{ totalGeneral.toLocaleString('es-MX') }}</div>
        </div>
      </div>
    </div>

    <div class="filtros-bar mb-3">
      <input v-model="busqueda" type="text" class="form-control filtro-input" placeholder="🔍 Buscar por contrato o cliente..." />
      <select v-model="filtroEstatus" class="form-select filtro-select">
        <option value="todos">Todos los estatus</option>
        <option value="pagado">Pagados</option>
        <option value="pendiente">Pendientes</option>
        <option value="vencido">Vencidos</option>
        <option value="cancelado">Cancelados</option>
      </select>
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
      <button class="btn btn-outline-secondary btn-sm" @click="limpiarFiltros">
        Limpiar filtros
      </button>
    </div>

    <div v-if="error" class="alert alert-warning">{{ error }}</div>

    <div v-if="cargando" class="text-center py-5">
      <div class="spinner-border" style="color: var(--secondary)"></div>
    </div>

    <div v-else-if="filtrados.length === 0 && !error" class="text-center py-5 text-muted">
      <p class="fs-5">No hay pagos que coincidan con los filtros.</p>
    </div>

    <div v-else-if="filtrados.length > 0" class="card shadow-sm">
      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead class="thead-custom">
            <tr>
              <th>Contrato</th>
              <th>Cliente</th>
              <th>Monto</th>
              <th>Fecha pago</th>
              <th>Cobrador</th>
              <th>Estatus</th>
              <th class="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in filtrados" :key="p.pagoID ?? p.id">
              <td class="fw-semibold">{{ p.contratoID ?? p.contrato_id ?? '—' }}</td>
              <td>{{ p.cliente ?? '—' }}</td>
              <td class="fw-semibold">${{ Number(p.monto ?? 0).toLocaleString('es-MX') }}</td>
              <td>{{ (p.fechaPago ?? p.fecha_pago) ? new Date(p.fechaPago ?? p.fecha_pago).toLocaleDateString('es-MX') : '—' }}</td>
              <td>{{ p.cobrador ?? '—' }}</td>
              <td>
                <span class="badge text-capitalize" :class="estatusClass(p.estatus ?? p.estado)">
                  {{ p.estatus ?? p.estado }}
                </span>
              </td>
              <td class="text-end">
                <button class="btn btn-sm btn-outline-secondary" @click="verDetalle(p)">
                  👁 Detalle
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <div v-if="modalDetalle" class="modal-backdrop-custom" @click.self="modalDetalle = false">
      <div class="modal-detalle">
        <div class="modal-header-custom">
          <h5 class="mb-0">Detalle del pago</h5>
          <button class="btn-close" @click="modalDetalle = false"></button>
        </div>
        <div class="modal-body-custom" v-if="pagoDetalle">
          <div class="detalle-row">
            <span class="detalle-label">ID Pago:</span>
            <span>{{ pagoDetalle.pagoID ?? pagoDetalle.id ?? '—' }}</span>
          </div>
          <div class="detalle-row">
            <span class="detalle-label">Contrato:</span>
            <span>{{ pagoDetalle.contratoID ?? pagoDetalle.contrato_id ?? '—' }}</span>
          </div>
          <div class="detalle-row">
            <span class="detalle-label">Cliente:</span>
            <span>{{ pagoDetalle.cliente ?? '—' }}</span>
          </div>
          <div class="detalle-row">
            <span class="detalle-label">Monto:</span>
            <span class="fw-bold">${{ Number(pagoDetalle.monto ?? 0).toLocaleString('es-MX') }}</span>
          </div>
          <div class="detalle-row">
            <span class="detalle-label">Fecha de pago:</span>
            <span>{{ (pagoDetalle.fechaPago ?? pagoDetalle.fecha_pago) ? new Date(pagoDetalle.fechaPago ?? pagoDetalle.fecha_pago).toLocaleDateString('es-MX') : '—' }}</span>
          </div>
          <div class="detalle-row">
            <span class="detalle-label">Cobrador:</span>
            <span>{{ pagoDetalle.cobrador ?? '—' }}</span>
          </div>
          <div class="detalle-row">
            <span class="detalle-label">Estatus:</span>
            <span class="badge text-capitalize" :class="estatusClass(pagoDetalle.estatus ?? pagoDetalle.estado)">
              {{ pagoDetalle.estatus ?? pagoDetalle.estado }}
            </span>
          </div>
        </div>
        <div class="modal-footer-custom">
          <button class="btn btn-outline-secondary" @click="modalDetalle = false">Cerrar</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.card-resumen {
  background: #fff;
  border-radius: 12px;
  padding: 18px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  border-left: 4px solid var(--secondary);
}
.card-pagado { border-left-color: #28a745; }
.card-pendiente { border-left-color: #ffc107; }
.card-vencido { border-left-color: #dc3545; }
.card-total { border-left-color: var(--primary); }
.resumen-label { font-size: 0.85rem; color: #777; margin-bottom: 4px; }
.resumen-monto { font-size: 1.4rem; font-weight: 700; color: var(--primary); }
.filtros-bar { display: flex; gap: 12px; flex-wrap: wrap; align-items: center; }
.filtro-input { max-width: 320px; border-radius: 10px; }
.filtro-select { max-width: 200px; border-radius: 10px; }
.filtro-fecha { max-width: 160px; border-radius: 10px; }
.thead-custom th { background: var(--primary); color: #fff; font-weight: 600; padding: 12px 16px; }
.modal-backdrop-custom {
  position: fixed; inset: 0; background: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 1050;
}
.modal-detalle {
  background: #fff; border-radius: 12px; width: 90%; max-width: 500px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.2);
}
.modal-header-custom {
  padding: 16px 20px; border-bottom: 1px solid #eee;
  display: flex; justify-content: space-between; align-items: center;
}
.modal-body-custom { padding: 20px; }
.modal-footer-custom { padding: 12px 20px; border-top: 1px solid #eee; text-align: right; }
.detalle-row {
  display: flex; justify-content: space-between;
  padding: 8px 0; border-bottom: 1px solid #f0f0f0;
}
.detalle-row:last-child { border-bottom: none; }
.detalle-label { color: #666; font-weight: 500; }
</style>