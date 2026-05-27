<script setup>
import { ref, onMounted } from 'vue'
import { servicioService } from '@/services/otros.service'
import ConfirmModal from '@/components/ConfirmModal.vue'

const servicios = ref([])
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
    const { data } = await servicioService.listar()
    servicios.value = Array.isArray(data) ? data : data.data ?? []
  } catch {
    error.value = 'No se pudo cargar la lista de servicios.'
  } finally {
    cargando.value = false
  }
}

function pedirBaja(servicio) {
  seleccionado.value = servicio
  modalVisible.value = true
}

async function confirmarBaja() {
  procesando.value = true
  error.value = ''
  exito.value = ''
  try {
    const id = seleccionado.value.servicioID
      || seleccionado.value.servicio_id
      || seleccionado.value.adicional_id
    if (!id) return
    await servicioService.darBaja(id)
    exito.value = `Servicio "${seleccionado.value.nombre}" dado de baja correctamente.`
    modalVisible.value = false
    await cargar()
  } catch {
    error.value = 'Error al dar de baja el servicio.'
  } finally {
    procesando.value = false
  }
}

onMounted(cargar)
</script>

<template>
  <div class="container py-4">
    <div class="d-flex justify-content-between align-items-center mb-4">
      <div>
        <h3 class="mb-0 fw-bold" style="color: var(--primary)">Servicios</h3>
        <small class="text-muted">Gestión y baja lógica de servicios</small>
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

    <div v-else-if="servicios.length === 0" class="text-center py-5 text-muted">
      <p class="fs-5">No hay servicios registrados.</p>
    </div>

    <div v-else class="card shadow-sm">
      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead class="table-header-custom">
            <tr>
              <th>#</th>
              <th>Nombre</th>
              <th>Descripción</th>
              <th>Precio</th>
              <th>Estado</th>
              <th class="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="s in servicios"
              :key="s.servicioID"
              :class="{ 'table-row-inactive': s.activo === false }"
            >
              <td>{{ s.servicioID }}</td>
              <td class="fw-semibold">{{ s.nombre }}</td>
              <td>{{ s.descripcion || '—' }}</td>
              <td>${{ Number(s.precio ?? 0).toLocaleString('es-MX') }}</td>
              <td>
                <span class="badge" :class="s.activo === false ? 'bg-secondary' : 'badge-activo'">
                  {{ s.activo === false ? 'Inactivo' : 'Activo' }}
                </span>
              </td>
              <td class="text-end">
                <button
                  v-if="s.activo !== false"
                  class="btn btn-sm btn-outline-danger"
                  @click="pedirBaja(s)"
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
      titulo="Baja lógica de servicio"
      :mensaje="`¿Dar de baja el servicio &quot;${seleccionado?.nombre}&quot;?`"
      :cargando="procesando"
      @confirmar="confirmarBaja"
      @cancelar="modalVisible = false"
    />
  </div>
</template>

<style scoped>
.table-header-custom th { background: var(--primary); color: #fff; font-weight: 600; padding: 12px 16px; }
.table-row-inactive td { opacity: 0.5; }
.badge-activo { background-color: var(--secondary); }
</style>
