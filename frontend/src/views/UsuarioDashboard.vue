<script setup>
import { ref, onMounted } from 'vue'
import { useAuth } from '@/composables/useAuth'
import api from '@/services/api'

const { usuario } = useAuth()

const paquetes = ref([])
const cargando = ref(false)
const error = ref('')
const exito = ref('')
const contratando = ref(null)

async function cargarPaquetes() {
  cargando.value = true
  error.value = ''
  try {
    const { data } = await api.get('/paquetes')
    paquetes.value = Array.isArray(data) ? data : data.data ?? []
  } catch {
    error.value = 'No se pudieron cargar los servicios disponibles.'
  } finally {
    cargando.value = false
  }
}

async function contratar(paquete) {
  contratando.value = paquete.paqueteID
  exito.value = ''
  error.value = ''
  try {
    // TODO: conectar con endpoint real de contratos
    await new Promise(r => setTimeout(r, 800))
    exito.value = `Solicitud para "${paquete.nombre}" enviada correctamente. Un asesor se pondrá en contacto contigo.`
  } catch {
    error.value = 'Error al enviar la solicitud.'
  } finally {
    contratando.value = null
  }
}

onMounted(cargarPaquetes)
</script>

<template>
  <div class="container py-4">

    <div class="mb-4">
      <h2 class="fw-bold" style="color: var(--primary)">Bienvenido, {{ usuario?.nombre }}</h2>
      <p class="text-muted">Explora nuestros servicios y contrata el que mejor se adapte a tus necesidades.</p>
    </div>

    <div v-if="exito" class="alert alert-success alert-dismissible">
      {{ exito }}
      <button type="button" class="btn-close" @click="exito = ''"></button>
    </div>
    <div v-if="error" class="alert alert-warning">{{ error }}</div>

    <div v-if="cargando" class="text-center py-5">
      <div class="spinner-border" style="color: var(--secondary)"></div>
      <p class="mt-2 text-muted">Cargando servicios…</p>
    </div>

    <!-- Sin paquetes en backend: muestra catálogo estático de ejemplo -->
    <div v-else-if="paquetes.length === 0">
      <h5 class="fw-bold mb-3" style="color: var(--primary)">Nuestros servicios</h5>
      <div class="row g-4">

        <div class="col-md-4" v-for="servicio in serviciosEjemplo" :key="servicio.id">
          <div class="servicio-card shadow-sm h-100">
            <div class="servicio-card__icono">{{ servicio.icono }}</div>
            <h5 class="fw-bold mb-2">{{ servicio.nombre }}</h5>
            <p class="text-muted mb-3">{{ servicio.descripcion }}</p>
            <p class="fw-bold precio mb-4">${{ servicio.precio.toLocaleString('es-MX') }} MXN</p>
            <button class="btn btn-custom w-100" @click="contratar(servicio)">
              <span v-if="contratando === servicio.id" class="spinner-border spinner-border-sm me-2"></span>
              {{ contratando === servicio.id ? 'Enviando…' : 'Contratar' }}
            </button>
          </div>
        </div>

      </div>
    </div>

    <!-- Con paquetes reales del backend -->
    <div v-else>
      <h5 class="fw-bold mb-3" style="color: var(--primary)">Nuestros servicios</h5>
      <div class="row g-4">
        <div class="col-md-4" v-for="p in paquetes" :key="p.paqueteID">
          <div class="servicio-card shadow-sm h-100">
            <div class="servicio-card__icono">📦</div>
            <h5 class="fw-bold mb-2">{{ p.nombre }}</h5>
            <p class="text-muted mb-3">{{ p.descripcion }}</p>
            <p class="fw-bold precio mb-4">${{ Number(p.precioBase).toLocaleString('es-MX') }} MXN</p>
            <button
              class="btn btn-custom w-100"
              @click="contratar(p)"
              :disabled="contratando === p.paqueteID"
            >
              <span v-if="contratando === p.paqueteID" class="spinner-border spinner-border-sm me-2"></span>
              {{ contratando === p.paqueteID ? 'Enviando…' : 'Contratar' }}
            </button>
          </div>
        </div>
      </div>
    </div>

  </div>
</template>

<script>
// Catálogo de ejemplo mientras no haya paquetes en el backend
const serviciosEjemplo = [
  {
    id: 1,
    icono: '🕊️',
    nombre: 'Servicio Básico',
    descripcion: 'Incluye velación, traslado local y trámites administrativos básicos.',
    precio: 15000,
  },
  {
    id: 2,
    icono: '⚱️',
    nombre: 'Servicio Intermedio',
    descripcion: 'Todo lo del servicio básico más arreglo floral y sala de velación privada.',
    precio: 25000,
  },
  {
    id: 3,
    icono: '✨',
    nombre: 'Servicio Premium',
    descripcion: 'Servicio completo con traslado nacional, ceremonia personalizada y asesoría integral.',
    precio: 45000,
  },
]
</script>

<style scoped>
.servicio-card {
  background: #fff;
  border-radius: 16px;
  padding: 28px;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  transition: transform 0.2s, box-shadow 0.2s;
}
.servicio-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 28px rgba(47,65,86,0.15) !important;
}
.servicio-card__icono {
  font-size: 2.5rem;
  margin-bottom: 12px;
}
.precio {
  font-size: 1.3rem;
  color: var(--primary);
}
</style>