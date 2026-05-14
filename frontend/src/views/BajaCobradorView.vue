<script setup>
import { ref, onMounted } from 'vue'
import { cobradorService } from '@/services/otros.service'
import ConfirmModal from '@/components/ConfirmModal.vue'

const cobradores = ref([])
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
    const { data } = await cobradorService.listar()
    cobradores.value = Array.isArray(data) ? data : data.data ?? []
  } catch {
    error.value = 'No se pudo cargar la lista de cobradores.'
  } finally {
    cargando.value = false
  }
}

function pedirBaja(cobrador) {
  seleccionado.value = cobrador
  modalVisible.value = true
}

async function confirmarBaja() {
  procesando.value = true
  error.value = ''
  exito.value = ''
  try {
    await cobradorService.darBaja(seleccionado.value.cobradorID)
    exito.value = `Cobrador "${seleccionado.value.nombre}" dado de baja correctamente.`
    modalVisible.value = false
    await cargar()
  } catch {
    error.value = 'Error al dar de baja el cobrador.'
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
        <h3 class="mb-0 fw-bold" style="color: var(--primary)">Cobradores</h3>
        <small class="text-muted">Gestión y baja lógica de cobradores</small>
      </div>
      <router-link to="/alta-cobrador" class="btn btn-custom">
        + Nuevo cobrador
      </router-link>
    </div>

    <div v-if="exito" class="alert alert-success alert-dismissible">
      {{ exito }}
      <button type="button" class="btn-close" @click="exito = ''"></button>
    </div>
    <div v-if="error" class="alert alert-danger">{{ error }}</div>

    <div v-if="cargando" class="text-center py-5">
      <div class="spinner-border" style="color: var(--secondary)"></div>
    </div>

    <div v-else-if="cobradores.length === 0" class="text-center py-5 text-muted">
      <p class="fs-5">No hay cobradores registrados.</p>
    </div>

    <div v-else class="card shadow-sm">
      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead class="table-header-custom">
            <tr>
              <th>#</th>
              <th>Nombre</th>
              <th>Teléfono</th>
              <th>Dirección</th>
              <th>Estado</th>
              <th class="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="c in cobradores"
              :key="c.cobradorID"
              :class="{ 'table-row-inactive': c.activo === false }"
            >
              <td>{{ c.cobradorID }}</td>
              <td class="fw-semibold">{{ c.nombre }}</td>
              <td>{{ c.telefono }}</td>
              <td>{{ c.direccion }}</td>
              <td>
                <span class="badge" :class="c.activo === false ? 'bg-secondary' : 'badge-activo'">
                  {{ c.activo === false ? 'Inactivo' : 'Activo' }}
                </span>
              </td>
              <td class="text-end">
                <div class="d-flex gap-2 justify-content-end">
                  <router-link
                    v-if="c.activo !== false"
                    :to="`/editar-cobrador/${c.cobradorID}`"
                    class="btn btn-sm btn-outline-secondary"
                    title="Editar"
                  >
                   Editar
                  </router-link>
                  <button
                    v-if="c.activo !== false"
                    class="btn btn-sm btn-outline-danger"
                    @click="pedirBaja(c)"
                  >
                    🗑 Dar de baja
                  </button>
                  <span v-else class="text-muted small">—</span>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <ConfirmModal
      :show="modalVisible"
      titulo="Baja lógica de cobrador"
      :mensaje="`¿Dar de baja al cobrador &quot;${seleccionado?.nombre}&quot;?`"
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