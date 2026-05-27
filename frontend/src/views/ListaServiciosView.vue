<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'

const paquetes = ref([])
const adicionales = ref([])
const cargando = ref(false)
const error = ref('')
const busqueda = ref('')
const filtroTipo = ref('todos')
const filtroEstado = ref('todos')

async function cargar() {
  cargando.value = true
  error.value = ''
  try {
    const { data } = await api.get('/administrativos/productos-activos')
    paquetes.value = data.productosActivos?.paquetes ?? []
    adicionales.value = data.productosActivos?.adicionales ?? []
  } catch {
    error.value = 'No se pudieron cargar los servicios.'
  } finally {
    cargando.value = false
  }
}

const todos = computed(() => {
  const p = paquetes.value.map(x => ({ ...x, _tipo: 'Paquete', _id: x.paquete_id }))
  const a = adicionales.value.map(x => ({ ...x, _tipo: 'Adicional', _id: x.adicional_id }))
  if (filtroTipo.value === 'paquetes') return p
  if (filtroTipo.value === 'adicionales') return a
  return [...p, ...a]
})

const filtrados = computed(() => {
  const q = busqueda.value.toLowerCase().trim()
  let lista = todos.value
  if (q) lista = lista.filter(s => (s.nombre ?? '').toLowerCase().includes(q) || (s.descripcion ?? '').toLowerCase().includes(q))
  if (filtroEstado.value === 'activos') lista = lista.filter(s => s.activo !== false)
  else if (filtroEstado.value === 'inactivos') lista = lista.filter(s => s.activo === false)
  return lista
})

onMounted(cargar)
</script>

<template>
  <div class="container py-4">
    <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
      <div>
        <h3 class="mb-0 fw-bold" style="color: var(--primary)">Servicios y Paquetes</h3>
        <small class="text-muted">{{ filtrados.length }} resultado(s)</small>
      </div>
      <router-link to="/alta-paquete" class="btn btn-custom">+ Nuevo servicio</router-link>
    </div>

    <div class="filtros-bar mb-4">
      <input v-model="busqueda" type="text" class="form-control filtro-input" placeholder="🔍 Buscar por nombre o descripción…" />
      <div class="btn-group">
        <button v-for="op in [{val:'todos',label:'Todos'},{val:'paquetes',label:'Paquetes'},{val:'adicionales',label:'Adicionales'}]"
          :key="op.val" class="btn btn-filtro" :class="{ activo: filtroTipo === op.val }" @click="filtroTipo = op.val">
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

    <div v-if="error" class="alert alert-danger">{{ error }}</div>

    <div v-if="cargando" class="text-center py-5">
      <div class="spinner-border" style="color:var(--secondary)"></div>
      <p class="mt-2 text-muted">Cargando…</p>
    </div>

    <div v-else-if="filtrados.length === 0" class="sin-datos">Sin resultados.</div>

    <div v-else class="card shadow-sm">
      <div class="table-responsive">
        <table class="table table-hover mb-0">
          <thead class="thead-custom">
            <tr>
              <th>Nombre</th>
              <th>Tipo</th>
              <th>Descripción</th>
              <th>Precio base</th>
              <th>Estado</th>
              <th class="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="s in filtrados" :key="s._id" :class="{ 'fila-inactiva': s.activo === false }">
              <td class="fw-semibold">{{ s.nombre }}</td>
              <td>
                <span class="badge" :class="s._tipo === 'Paquete' ? 'badge-paquete' : 'badge-adicional'">
                  {{ s._tipo }}
                </span>
              </td>
              <td class="text-muted small">{{ s.descripcion ?? '—' }}</td>
              <td class="fw-semibold">${{ Number(s.precio_base ?? s.precio ?? 0).toLocaleString('es-MX') }}</td>
              <td>
                <span class="badge" :class="s.activo === false ? 'bg-secondary' : 'badge-activo'">
                  {{ s.activo === false ? 'Inactivo' : 'Activo' }}
                </span>
              </td>
              <td v-if="s._tipo === 'Adicional'" class="text-end">
                <router-link
                  :to="`/editar-servicio/${s._id}`"
                  class="btn btn-sm btn-outline-secondary me-1"
                  title="Editar"
                >✏️</router-link>
                <router-link
                  v-if="s.activo !== false"
                  to="/baja-servicio"
                  class="btn btn-sm btn-outline-danger"
                  title="Dar de baja"
                >🗑</router-link>
              </td>
              <td v-else class="text-muted text-end">—</td>
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
.badge-paquete { background-color: var(--primary); }
.badge-adicional { background-color: #7a9bb5; }
.sin-datos { background: #fff; border-radius: 14px; padding: 60px; text-align: center; color: #aaa; }
</style>
