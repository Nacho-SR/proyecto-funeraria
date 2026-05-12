<script setup>
import { ref, onMounted } from 'vue'
import { contratoService } from '@/services/otros.service'
import ConfirmModal from '@/components/ConfirmModal.vue'

const contratos = ref([])
const cargando = ref(false)
const error = ref('')
const exito = ref('')
const modalVisible = ref(false)
const seleccionado = ref(null)
const procesando = ref(false)

async function cargar() {
  cargando.value = true
  error.value = ''
  try {
    const { data } = await contratoService.listar()
    contratos.value = Array.isArray(data) ? data : data.data ?? []
  } catch {
    error.value = 'No se pudo cargar la lista de contratos.'
  } finally {
    cargando.value = false
  }
}

function pedirBaja(contrato) {
  seleccionado.value = contrato
  modalVisible.value = true
}

async function confirmarBaja() {
  procesando.value = true
  error.value = ''
  exito.value = ''
  try {
    await contratoService.darBaja(seleccionado.value.contratoID)
    exito.value = `Contrato "${seleccionado.value.numContrato}" dado de baja correctamente.`
    modalVisible.value = false
    await cargar()
  } catch {
    error.value = 'Error al dar de baja el contrato.'
  } finally {
    procesando.value = false
  }
}

const estadoClass = (estado) => ({
  'activo': 'bg-success',
  'pagado': 'bg-primary',
  'cancelado': 'bg-danger',
  'suspendido': 'bg-warning text-dark',
}[estado] || 'bg-secondary')

onMounted(cargar)
</script>

<template>
  <div class="container py-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h3 class="mb-0 fw-bold" style="color: var(--primary)">Contratos</h3>
        <small class="text-muted">Gestión y baja lógica de contratos</small>
      </div>
    </div>

    <div v-if="exito" class="alert alert-success alert-dismissible">
      {{ exito }}
      <button type="button" class="btn-close" @click="exito = ''"></button>
    </div>
    <div v-if="error" class="alert alert-danger">{{ error }}</div>

    <div v-if="cargando" class="text-center py-5">
      <div class="spinner-border" style="color: var(--secondary)"></div>
    </div>

    <div v-else-if="contratos.length === 0" class="text-center py-5 text-muted">
      <p class="fs-5">No hay contratos registrados.</p>
    </div>

    <div v-else class="card shadow-sm">
      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead class="table-header-custom">
            <tr>
              <th>N° Contrato</th>
              <th>Cliente ID</th>
              <th>Paquete ID</th>
              <th>Fecha inicio</th>
              <th>Frecuencia</th>
              <th>Precio total</th>
              <th>Estado</th>
              <th class="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="c in contratos"
              :key="c.contratoID"
              :class="{ 'table-row-inactive': c.activo === false }"
            >
              <td class="fw-semibold">{{ c.numContrato }}</td>
              <td>{{ c.id_cliente }}</td>
              <td>{{ c.id_paquete }}</td>
              <td>{{ c.fechaInicio ? new Date(c.fechaInicio).toLocaleDateString('es-MX') : '—' }}</td>
              <td class="text-capitalize">{{ c.frecuenciaPago }}</td>
              <td>${{ Number(c.precioTotal).toLocaleString('es-MX') }}</td>
              <td>
                <span class="badge" :class="estadoClass(c.estado)">
                  {{ c.estado }}
                </span>
              </td>
              <td class="text-end">
                <button
                  v-if="c.activo !== false && c.estado !== 'cancelado'"
                  class="btn btn-sm btn-outline-danger"
                  @click="pedirBaja(c)"
                >
                  🗑 Dar de baja
                </button>
                <span v-else class="text-muted small">—</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <ConfirmModal
      :show="modalVisible"
      titulo="Baja lógica de contrato"
      :mensaje="`¿Dar de baja el contrato &quot;${seleccionado?.numContrato}&quot;? El estado cambiará a cancelado.`"
      :cargando="procesando"
      @confirmar="confirmarBaja"
      @cancelar="modalVisible = false"
    />
  </div>
</template>

<style scoped>
.table-header-custom th { background: var(--primary); color: #fff; font-weight: 600; padding: 12px 16px; }
.table-row-inactive td { opacity: 0.5; }
</style>
