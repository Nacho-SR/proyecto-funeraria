<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'

const todos = ref([])
const cargando = ref(false)
const error = ref('')
const busqueda = ref('')
const filtroFrecuencia = ref('todos')
const filtroEstado = ref('todos')

async function cargar() {
  cargando.value = true
  error.value = ''
  try {
    const { data } = await api.get('/administrativos/contratos')
    todos.value = Array.isArray(data) ? data : data.contratos ?? []
  } catch {
    error.value = 'No se pudieron cargar los contratos.'
  } finally {
    cargando.value = false
  }
}

const filtrados = computed(() => {
  let lista = todos.value
  const q = busqueda.value.toLowerCase().trim()
  if (q) {
    lista = lista.filter(c =>
      (c.num_contrato ?? '').toLowerCase().includes(q) ||
      (c.clientes_id ?? '').toLowerCase().includes(q)
    )
  }
  if (filtroFrecuencia.value !== 'todos') lista = lista.filter(c => c.frecuencia_pago === filtroFrecuencia.value)
  if (filtroEstado.value === 'activos') lista = lista.filter(c => c.activo !== false)
  else if (filtroEstado.value === 'inactivos') lista = lista.filter(c => c.activo === false)
  return lista
})

const frecuenciaClass = (f) => ({ 'semanal': 'bg-info text-dark', 'quincenal': 'bg-warning text-dark', 'mensual': 'bg-primary' }[f] ?? 'bg-secondary')

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
      <input v-model="busqueda" type="text" class="form-control filtro-input" placeholder="🔍 Buscar por N° contrato o cliente…" />
      <div class="btn-group">
        <button v-for="op in [{val:'todos',label:'Todos'},{val:'semanal',label:'Semanal'},{val:'quincenal',label:'Quincenal'},{val:'mensual',label:'Mensual'}]"
          :key="op.val" class="btn btn-filtro" :class="{ activo: filtroFrecuencia === op.val }" @click="filtroFrecuencia = op.val">
          {{ op.label }}
        </button>
      </div>
      <div class="btn-group">
        <button v-for="op in [{val:'todos',label:'Todos'},{val:'activos',label:'Activos'},{val:'inactivos',label:'Inactivos'}]"
          :key="op.val" class="btn btn-filtro" :class="{ activo: filtroEstado === op.val }" @click="filtroEstado = op.val">
          {{ op.label }}
        </button>
      </div>
    </div>

    <div v-if="error" class="alert alert-warning">
      {{ error }} <small class="d-block text-muted">El endpoint de contratos puede no estar implementado aún en el backend.</small>
    </div>

    <div v-if="cargando" class="text-center py-5">
      <div class="spinner-border" style="color:var(--secondary)"></div>
    </div>

    <div v-else-if="filtrados.length === 0 && !error" class="sin-datos">Sin contratos registrados.</div>

    <div v-else-if="filtrados.length > 0" class="card shadow-sm">
      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead class="thead-custom">
            <tr>
              <th>N° Contrato</th>
              <th>Cliente ID</th>
              <th>Paquete ID</th>
              <th>Fecha inicio</th>
              <th>Frecuencia</th>
              <th>Estado</th>
              <th class="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="c in filtrados" :key="c.id" :class="{ 'fila-inactiva': c.activo === false }">
              <td class="fw-semibold">{{ c.num_contrato ?? '—' }}</td>
              <td>{{ c.clientes_id ?? '—' }}</td>
              <td>{{ c.paquetes_id ?? '—' }}</td>
              <td>{{ c.fecha_inicio ? new Date(c.fecha_inicio).toLocaleDateString('es-MX') : '—' }}</td>
              <td><span class="badge text-capitalize" :class="frecuenciaClass(c.frecuencia_pago)">{{ c.frecuencia_pago }}</span></td>
              <td>
                <span class="badge" :class="c.activo === false ? 'bg-secondary' : 'badge-activo'">
                  {{ c.activo === false ? 'Inactivo' : 'Activo' }}
                </span>
              </td>
              <td class="text-end">
                <router-link to="/baja-contrato" class="btn btn-sm btn-outline-danger" v-if="c.activo !== false">🗑</router-link>
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
.btn-filtro { border: 1.5px solid var(--secondary); color: var(--secondary); background: #fff; font-size: 0.85rem; padding: 6px 14px; transition: all 0.2s; }
.btn-filtro:first-child { border-radius: 10px 0 0 10px; }
.btn-filtro:last-child { border-radius: 0 10px 10px 0; }
.btn-filtro.activo { background: var(--secondary); color: #fff; }
.thead-custom th { background: var(--primary); color: #fff; font-weight: 600; padding: 12px 16px; }
.fila-inactiva td { opacity: 0.5; }
.badge-activo { background-color: var(--secondary); }
.sin-datos { background: #fff; border-radius: 14px; padding: 60px; text-align: center; color: #aaa; }
</style>
