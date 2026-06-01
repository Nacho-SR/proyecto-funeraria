<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { validacionRutasService } from '@/services/validacionRutas.service'

const router = useRouter()

const rutas = ref([])
const cargando = ref(false)
const error = ref('')
const busqueda = ref('')

onMounted(cargar)

async function cargar() {
  cargando.value = true
  error.value = ''
  try {
    const { data } = await validacionRutasService.listar()
    rutas.value = data?.rutas ?? []
  } catch (err) {
    error.value = err.response?.data?.message || 'No se pudieron cargar las rutas de cobro.'
  } finally {
    cargando.value = false
  }
}

const filtradas = computed(() => {
  const q = busqueda.value.trim().toLowerCase()
  if (!q) return rutas.value
  return rutas.value.filter(ruta =>
    String(ruta.nombre ?? '').toLowerCase().includes(q) ||
    String(ruta.cobrador ?? '').toLowerCase().includes(q) ||
    String(ruta.estado ?? '').toLowerCase().includes(q)
  )
})

function validarRuta(ruta) {
  router.push({ name: 'validacion-ruta-cobro', params: { id: ruta.ruta_cobros_id } })
}

function estadoClass(estado) {
  return {
    asignada: 'bg-secondary',
    'en curso': 'bg-info text-dark',
    completada: 'bg-success'
  }[estado] ?? 'bg-secondary'
}

function formatoFecha(valor) {
  if (!valor) return 'Sin fecha'
  const segundos = valor.seconds ?? valor._seconds
  const fecha = valor.toDate?.() ?? (segundos ? new Date(segundos * 1000) : new Date(valor))
  if (Number.isNaN(fecha.getTime())) return 'Sin fecha'
  return fecha.toLocaleDateString('es-MX')
}

function formatoMoneda(valor) {
  return Number(valor ?? 0).toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN'
  })
}
</script>

<template>
  <div class="container py-4">
    <div class="d-flex justify-content-between align-items-start mb-4 flex-wrap gap-2">
      <div>
        <h3 class="mb-0 fw-bold" style="color: var(--primary)">Validacion de cobros</h3>
        <small class="text-muted">Revisa rutas completadas y cierra su ciclo de cobro.</small>
      </div>
      <button class="btn btn-outline-secondary" @click="cargar" :disabled="cargando">
        Actualizar
      </button>
    </div>

    <div v-if="error" class="alert alert-danger">{{ error }}</div>

    <div class="mb-4">
      <input
        v-model="busqueda"
        type="text"
        class="form-control"
        style="max-width: 380px"
        placeholder="Buscar por ruta, cobrador o estado..."
      />
    </div>

    <div v-if="cargando" class="text-center py-5">
      <div class="spinner-border" style="color: var(--secondary)"></div>
    </div>

    <div v-else-if="filtradas.length === 0" class="text-center py-5 text-muted">
      <p class="fs-5">No hay rutas para mostrar.</p>
    </div>

    <div v-else class="card shadow-sm">
      <div class="table-responsive">
        <table class="table table-hover align-middle mb-0">
          <thead class="thead-custom">
            <tr>
              <th>Ruta</th>
              <th>Cobrador</th>
              <th>Fecha inicio</th>
              <th>Estado</th>
              <th>Periodicidad</th>
              <th>Avance</th>
              <th>Monto recibido</th>
              <th class="text-end">Acciones</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="ruta in filtradas" :key="ruta.ruta_cobros_id">
              <td class="fw-semibold">{{ ruta.nombre }}</td>
              <td>{{ ruta.cobrador ?? 'Sin cobrador' }}</td>
              <td>{{ formatoFecha(ruta.fecha_inicio) }}</td>
              <td>
                <span class="badge text-capitalize" :class="estadoClass(ruta.estado)">
                  {{ ruta.estado }}
                </span>
              </td>
              <td class="text-capitalize">{{ ruta.periodicidad }}</td>
              <td>
                {{ ruta.resumen?.revisadas ?? 0 }} / {{ ruta.resumen?.total ?? 0 }} revisadas
              </td>
              <td class="fw-semibold">{{ formatoMoneda(ruta.resumen?.monto_recibido) }}</td>
              <td class="text-end">
                <button
                  v-if="ruta.estado === 'completada'"
                  class="btn btn-sm btn-custom"
                  @click="validarRuta(ruta)"
                >
                  Validar ruta
                </button>
                <button
                  v-else
                  class="btn btn-sm btn-outline-secondary"
                  @click="validarRuta(ruta)"
                >
                  Ver detalle
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
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
