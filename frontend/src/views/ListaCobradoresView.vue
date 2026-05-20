<script setup>
import { ref, computed, onMounted } from 'vue'
import api from '@/services/api'

const todos = ref([])
const cargando = ref(false)
const error = ref('')
const busqueda = ref('')
const filtroEstado = ref('todos')

async function cargar() {
  cargando.value = true
  error.value = ''
  try {
    const { data } = await api.get('/administrativos/cobradores-activos')
    todos.value = data.cobradores ?? []
  } catch {
    error.value = 'No se pudieron cargar los cobradores.'
  } finally {
    cargando.value = false
  }
}

const filtrados = computed(() => {
  let lista = todos.value
  const q = busqueda.value.toLowerCase().trim()
  if (q) {
    lista = lista.filter(({ cobrador, usuario }) => {
      const nombre = `${usuario?.nombre ?? ''} ${usuario?.apaterno ?? ''} ${usuario?.amaterno ?? ''}`.toLowerCase()
      const email = (usuario?.email ?? '').toLowerCase()
      return nombre.includes(q) || email.includes(q)
    })
  }
  if (filtroEstado.value === 'activos') lista = lista.filter(({ cobrador }) => cobrador.activo !== false)
  else if (filtroEstado.value === 'inactivos') lista = lista.filter(({ cobrador }) => cobrador.activo === false)
  return lista
})

onMounted(cargar)
</script>

<template>
  <div class="container py-4">
    <div class="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
      <div>
        <h3 class="mb-0 fw-bold" style="color: var(--primary)">Cobradores</h3>
        <small class="text-muted">{{ filtrados.length }} resultado(s)</small>
      </div>
    </div>

    <div class="filtros-bar mb-4">
      <input v-model="busqueda" type="text" class="form-control filtro-input" placeholder="🔍 Buscar por nombre o email…" />
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
              <th>Nombre completo</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th>Dirección</th>
              <th>Estado</th>
              <th class="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="{ cobrador, usuario } in filtrados" :key="cobrador.cobrador_id" :class="{ 'fila-inactiva': cobrador.activo === false }">
              <td class="fw-semibold">{{ usuario?.nombre }} {{ usuario?.apaterno }} {{ usuario?.amaterno }}</td>
              <td>{{ usuario?.email ?? '—' }}</td>
              <td>{{ cobrador.telefono ?? '—' }}</td>
              <td>{{ cobrador.direccion ?? '—' }}</td>
              <td>
                <span class="badge" :class="cobrador.activo === false ? 'bg-secondary' : 'badge-activo'">
                  {{ cobrador.activo === false ? 'Inactivo' : 'Activo' }}
                </span>
              </td>
              <td class="text-end">
                <router-link :to="`/editar-cobrador/${cobrador.cobrador_id}`" class="btn btn-sm btn-outline-secondary me-1">✏️</router-link>
                <router-link to="/baja-cobrador" class="btn btn-sm btn-outline-danger" v-if="cobrador.activo !== false">🗑</router-link>
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
.filtro-input { max-width: 340px; border-radius: 10px; }
.btn-filtro { border: 1.5px solid var(--secondary); color: var(--secondary); background: #fff; font-size: 0.85rem; padding: 6px 14px; transition: all 0.2s; }
.btn-filtro:first-child { border-radius: 10px 0 0 10px; }
.btn-filtro:last-child { border-radius: 0 10px 10px 0; }
.btn-filtro.activo { background: var(--secondary); color: #fff; }
.thead-custom th { background: var(--primary); color: #fff; font-weight: 600; padding: 12px 16px; }
.fila-inactiva td { opacity: 0.5; }
.badge-activo { background-color: var(--secondary); }
.sin-datos { background: #fff; border-radius: 14px; padding: 60px; text-align: center; color: #aaa; }
</style>
