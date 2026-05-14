<script setup>
import { ref, onMounted } from 'vue'
import { clienteService } from '@/services/cliente.service'
import ConfirmModal from '@/components/ConfirmModal.vue'

const clientes = ref([])
const cargando = ref(false)
const error = ref('')
const exito = ref('')

const modalVisible = ref(false)
const clienteSeleccionado = ref(null)
const procesando = ref(false)

async function cargar() {
  cargando.value = true
  error.value = ''
  try {
    const { data } = await clienteService.listar()
    clientes.value = Array.isArray(data.clientes) ? data.clientes : data.data ?? []
  } catch {
    error.value = 'No se pudo cargar la lista de clientes.'
  } finally {
    cargando.value = false
  }
}

function pedirBaja(cliente) {
  clienteSeleccionado.value = cliente
  modalVisible.value = true
}

async function confirmarBaja() {
  procesando.value = true
  exito.value = ''
  error.value = ''
  try {
    await clienteService.eliminar(clienteSeleccionado.value.cliente.cliente_id)
    exito.value = `Cliente "${clienteSeleccionado.value.usuario.nombre} ${clienteSeleccionado.value.usuario.apaterno}" dado de baja correctamente.`
    modalVisible.value = false
    await cargar()
  } catch {
    error.value = 'Error al dar de baja el cliente.'
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
        <h3 class="mb-0 fw-bold" style="color: var(--primary)">Clientes</h3>
        <small class="text-muted">Gestión y baja lógica de clientes</small>
      </div>
      <router-link to="/alta-cliente" class="btn btn-custom">
        + Nuevo cliente
      </router-link>
    </div>

    <div v-if="exito" class="alert alert-success alert-dismissible" role="alert">
      {{ exito }}
      <button type="button" class="btn-close" @click="exito = ''"></button>
    </div>
    <div v-if="error" class="alert alert-danger" role="alert">{{ error }}</div>

    <div v-if="cargando" class="text-center py-5">
      <div class="spinner-border" style="color: var(--secondary)"></div>
      <p class="mt-2 text-muted">Cargando clientes…</p>
    </div>

    <div v-else-if="clientes.length === 0" class="text-center py-5 text-muted">
      <p class="fs-5">No hay clientes registrados.</p>
    </div>

    <div v-else class="card shadow-sm">
      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead class="table-header-custom">
            <tr>
              <th>#</th>
              <th>Nombre</th>
              <th>Apellido Paterno</th>
              <th>Apellido Materno</th>
              <th>Teléfono</th>
              <th>Email</th>
              <th>Colonia</th>
              <th>Estado</th>
              <th class="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="c in clientes"
              :key="c.cliente.cliente_id"
              :class="{ 'table-row-inactive': c.activo === false }"
            >
              <td>{{ c.cliente.cliente_id }}</td>
              <td class="fw-semibold">{{ c.usuario.nombre }}</td>
              <td class="fw-semibold">{{ c.usuario.apaterno }}</td>
              <td class="fw-semibold">{{ c.usuario.amaterno }}</td>
              <td>{{ c.cliente.telefono }}</td>
              <td>{{ c.usuario.email || '—' }}</td>
              <td>{{ c.cliente.colonia }}</td>
              <td>
                <span
                  class="badge"
                  :class="c.activo === false ? 'bg-secondary' : 'badge-activo'"
                >
                  {{ c.activo === false ? 'Inactivo' : 'Activo' }}
                </span>
              </td>
              <td class="text-end">
                <div class="d-flex gap-2 justify-content-end">
                  <router-link
                    v-if="c.activo !== false"
                    :to="`/editar-cliente/${c.cliente.cliente_id}`"
                    class="btn btn-sm btn-outline-secondary"
                    title="Editar"
                  >
                  Editar
                  </router-link>
                  <button
                    v-if="c.activo !== false"
                    class="btn btn-sm btn-outline-danger"
                    @click="pedirBaja(c)"
                    title="Dar de baja"
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
      titulo="Baja lógica de cliente"
      :mensaje="`¿Dar de baja al cliente &quot;${clienteSeleccionado?.usuario.nombre} ${clienteSeleccionado?.usuario.apaterno}&quot;? El registro se conserva pero quedará inactivo.`"
      :cargando="procesando"
      @confirmar="confirmarBaja"
      @cancelar="modalVisible = false"
    />
  </div>
</template>

<style scoped>
.table-header-custom th {
  background: var(--primary);
  color: #fff;
  font-weight: 600;
  padding: 12px 16px;
}
.table-row-inactive td { opacity: 0.5; }
.badge-activo { background-color: var(--secondary); }
</style>