<script setup>
import { ref, computed, onMounted } from 'vue'
import { pagoService } from '@/services/pago.service'
import ConfirmModal from '@/components/ConfirmModal.vue'

const pagos = ref([])
const cargando = ref(false)
const error = ref('')
const exito = ref('')
const procesando = ref(false)

const modalVisible = ref(false)
const accionPendiente = ref(null)
const pagoSeleccionado = ref(null)

const busqueda = ref('')

async function cargar() {
  cargando.value = true
  error.value = ''
  try {
    const { data } = await pagoService.listar()
    const lista = Array.isArray(data) ? data : data.pagos ?? []
    pagos.value = lista.filter(p => p.estatus === 'por validar' || p.estado === 'por validar')
  } catch {
    error.value = 'No se pudieron cargar los pagos por validar.'
  } finally {
    cargando.value = false
  }
}

const filtrados = computed(() => {
  const q = busqueda.value.toLowerCase().trim()
  if (!q) return pagos.value
  return pagos.value.filter(p =>
    String(p.contratoID ?? p.contrato_id ?? '').toLowerCase().includes(q) ||
    String(p.cliente ?? '').toLowerCase().includes(q) ||
    String(p.ruta_cobros_id ?? '').toLowerCase().includes(q)
  )
})

function pedirAccion(pago, accion) {
  pagoSeleccionado.value = pago
  accionPendiente.value = accion
  modalVisible.value = true
}

async function confirmar() {
  procesando.value = true
  exito.value = ''
  error.value = ''
  try {
    const id = pagoSeleccionado.value.pagoID ?? pagoSeleccionado.value.id
    const nuevoEstatus = accionPendiente.value === 'aprobar' ? 'validado' : 'cancelado'
    const { data } = await pagoService.validar(id, { estatus: nuevoEstatus })
    const mensajeBase = accionPendiente.value === 'aprobar'
      ? 'Pago aprobado correctamente.'
      : 'Pago rechazado correctamente.'
    exito.value = data?.rutaRenovada
      ? `${mensajeBase} La ruta fue reactivada para ${formatoFecha(data.rutaRenovada.fecha_inicio)}.`
      : mensajeBase
    modalVisible.value = false
    await cargar()
  } catch {
    error.value = `Error al ${accionPendiente.value} el pago.`
  } finally {
    procesando.value = false
  }
}

const mensajeModal = computed(() => {
  if (!pagoSeleccionado.value) return ''
  const monto = Number(pagoSeleccionado.value.monto ?? 0).toLocaleString('es-MX')
  const accion = accionPendiente.value === 'aprobar' ? 'aprobar' : 'rechazar'
  return `¿Deseas ${accion} el pago de $${monto}? Esta acción no se puede deshacer.`
})

function formatoFecha(valor) {
  if (!valor) return 'la siguiente fecha'
  const fecha = new Date(valor)
  if (Number.isNaN(fecha.getTime())) return valor
  return fecha.toLocaleDateString('es-MX')
}

onMounted(cargar)
</script>

<template>
  <div class="container py-4">
    <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
      <div>
        <h3 class="mb-0 fw-bold" style="color: var(--primary)">Validación de cobros</h3>
        <small class="text-muted">{{ filtrados.length }} pago(s) por validar</small>
      </div>
    </div>

    <div v-if="exito" class="alert alert-success alert-dismissible">
      {{ exito }}
      <button type="button" class="btn-close" @click="exito = ''"></button>
    </div>
    <div v-if="error" class="alert alert-danger">{{ error }}</div>

    <div class="mb-4">
      <input
        v-model="busqueda"
        type="text"
        class="form-control"
        style="max-width: 350px"
        placeholder="🔍 Buscar por contrato o cliente..."
      />
    </div>

    <div v-if="cargando" class="text-center py-5">
      <div class="spinner-border" style="color: var(--secondary)"></div>
    </div>

    <div v-else-if="filtrados.length === 0" class="text-center py-5 text-muted">
      <p class="fs-5">No hay pagos pendientes de validación.</p>
    </div>

    <div v-else class="card shadow-sm">
      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead class="thead-custom">
            <tr>
              <th>Contrato</th>
              <th>Cliente</th>
              <th>Monto</th>
              <th>Fecha pago</th>
              <th>Cobrador</th>
              <th>Ruta</th>
              <th class="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="p in filtrados" :key="p.pagoID ?? p.id">
              <td class="fw-semibold">{{ p.contratoID ?? p.contrato_id ?? '—' }}</td>
              <td>{{ p.cliente ?? '—' }}</td>
              <td class="fw-semibold">${{ Number(p.monto ?? 0).toLocaleString('es-MX') }}</td>
              <td>{{ p.fechaPago ? new Date(p.fechaPago).toLocaleDateString('es-MX') : '—' }}</td>
              <td>{{ p.cobrador ?? '—' }}</td>
              <td>{{ p.ruta_cobros_id ?? 'â€”' }}</td>
              <td class="text-end">
                <div class="d-flex gap-2 justify-content-end">
                  <button
                    class="btn btn-sm btn-success"
                    @click="pedirAccion(p, 'aprobar')"
                    title="Aprobar pago"
                  >
                    ✓ Aprobar
                  </button>
                  <button
                    class="btn btn-sm btn-outline-danger"
                    @click="pedirAccion(p, 'rechazar')"
                    title="Rechazar pago"
                  >
                    ✕ Rechazar
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <ConfirmModal
      :show="modalVisible"
      :titulo="accionPendiente === 'aprobar' ? 'Aprobar pago' : 'Rechazar pago'"
      :mensaje="mensajeModal"
      :cargando="procesando"
      @confirmar="confirmar"
      @cancelar="modalVisible = false"
    />
  </div>
</template>

<style scoped>
.thead-custom th {
  background: var(--primary);
  color: #fff;
  font-weight: 600;
  padding: 12px 16px;
}
</style>
