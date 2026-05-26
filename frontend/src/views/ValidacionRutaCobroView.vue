<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { validacionRutasService } from '@/services/validacionRutas.service'

const route = useRoute()
const router = useRouter()

const ruta = ref(null)
const cargando = ref(false)
const procesando = ref(false)
const error = ref('')
const exito = ref('')

const rutaId = computed(() => route.params.id)
const detalles = computed(() => ruta.value?.detalles ?? [])
const cicloActual = computed(() => Number(ruta.value?.ciclo_actual ?? 1))
const puedeTerminar = computed(() =>
  ruta.value?.estado === 'completada' &&
  detalles.value.length > 0 &&
  detalles.value.every(item => visitaRevisada(item))
)

onMounted(cargar)

async function cargar() {
  cargando.value = true
  error.value = ''
  try {
    const { data } = await validacionRutasService.obtener(rutaId.value)
    ruta.value = data.ruta
  } catch (err) {
    error.value = err.response?.data?.message || 'No se pudo cargar la ruta.'
  } finally {
    cargando.value = false
  }
}

async function revisar(item, estatusPago) {
  procesando.value = true
  error.value = ''
  exito.value = ''
  try {
    const payload = estatusPago ? { estatus_pago: estatusPago } : {}
    const { data } = await validacionRutasService.revisarVisita(
      rutaId.value,
      item.detalle.detalle_ruta_cobros_id,
      payload
    )
    ruta.value = data.ruta
    exito.value = 'Visita revisada correctamente.'
  } catch (err) {
    error.value = err.response?.data?.message || 'No se pudo revisar la visita.'
  } finally {
    procesando.value = false
  }
}

async function terminar() {
  procesando.value = true
  error.value = ''
  exito.value = ''
  try {
    const { data } = await validacionRutasService.terminar(rutaId.value)
    exito.value = `Ruta reactivada para ${formatoFecha(data.rutaRenovada?.fecha_inicio)}.`
    await cargar()
  } catch (err) {
    error.value = err.response?.data?.message || 'No se pudo terminar la validacion de la ruta.'
  } finally {
    procesando.value = false
  }
}

function volver() {
  router.push({ name: 'validacion-cobros' })
}

function visitaDelCiclo(item) {
  return Number(item.detalle?.ciclo ?? 0) === cicloActual.value
}

function visitaRevisada(item) {
  return Number(item.detalle?.revision_ciclo ?? 0) === cicloActual.value && item.detalle?.revisado === true
}

function requierePago(item) {
  return visitaDelCiclo(item) && item.detalle?.resultado === 'pagado'
}

function pagoPendiente(item) {
  return requierePago(item) && (item.pago?.estatus ?? item.pago?.estado) === 'por validar'
}

function nombreCliente(item) {
  const usuario = item.cliente?.usuario
  if (!usuario) return 'Cliente sin nombre'
  return [usuario.nombre, usuario.apaterno, usuario.amaterno].filter(Boolean).join(' ')
}

function formatoDireccion(direccion) {
  if (!direccion) return 'Sin direccion'
  return [direccion.calle, direccion.num_casa, direccion.colonia, direccion.referencia].filter(Boolean).join(', ')
}

function formatoMoneda(valor) {
  return Number(valor ?? 0).toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN'
  })
}

function formatoFecha(valor) {
  if (!valor) return 'Sin fecha'
  const segundos = valor.seconds ?? valor._seconds
  const fecha = valor.toDate?.() ?? (segundos ? new Date(segundos * 1000) : new Date(valor))
  if (Number.isNaN(fecha.getTime())) return 'Sin fecha'
  return fecha.toLocaleDateString('es-MX')
}

function resultadoClass(resultado) {
  return {
    pagado: 'bg-success',
    pospuesto: 'bg-warning text-dark',
    NE: 'bg-secondary'
  }[resultado] ?? 'bg-light text-dark'
}
</script>

<template>
  <div class="container py-4">
    <div class="d-flex justify-content-between align-items-start gap-3 flex-wrap mb-4">
      <div>
        <button class="btn btn-sm btn-outline-secondary mb-3" @click="volver">
          Volver
        </button>
        <h3 class="mb-1 fw-bold" style="color: var(--primary)">Validar ruta</h3>
        <small class="text-muted" v-if="ruta">
          {{ ruta.nombre }} · {{ ruta.cobrador ?? 'Sin cobrador' }} · Ciclo {{ cicloActual }}
        </small>
      </div>
      <button class="btn btn-custom" @click="terminar" :disabled="!puedeTerminar || procesando">
        <span v-if="procesando" class="spinner-border spinner-border-sm me-2"></span>
        Terminar
      </button>
    </div>

    <div v-if="error" class="alert alert-danger">{{ error }}</div>
    <div v-if="exito" class="alert alert-success">{{ exito }}</div>

    <div v-if="cargando" class="text-center py-5">
      <div class="spinner-border" style="color: var(--secondary)"></div>
    </div>

    <template v-else-if="ruta">
      <div class="row g-3 mb-4">
        <div class="col-md-3">
          <div class="metric">
            <span>Fecha inicio</span>
            <strong>{{ formatoFecha(ruta.fecha_inicio) }}</strong>
          </div>
        </div>
        <div class="col-md-3">
          <div class="metric">
            <span>Estado</span>
            <strong class="text-capitalize">{{ ruta.estado }}</strong>
          </div>
        </div>
        <div class="col-md-3">
          <div class="metric">
            <span>Revisadas</span>
            <strong>{{ ruta.resumen?.revisadas ?? 0 }} / {{ ruta.resumen?.total ?? 0 }}</strong>
          </div>
        </div>
        <div class="col-md-3">
          <div class="metric">
            <span>Recibido</span>
            <strong>{{ formatoMoneda(ruta.resumen?.monto_recibido) }}</strong>
          </div>
        </div>
      </div>

      <div class="card shadow-sm">
        <div class="table-responsive">
          <table class="table table-hover align-middle mb-0">
            <thead class="thead-custom">
              <tr>
                <th>Orden</th>
                <th>Cliente</th>
                <th>Contrato</th>
                <th>Direccion</th>
                <th>Resultado</th>
                <th>Monto</th>
                <th>Pago</th>
                <th class="text-end">Validacion</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in detalles" :key="item.detalle.detalle_ruta_cobros_id">
                <td class="fw-bold">{{ item.detalle.orden_visita }}</td>
                <td>{{ nombreCliente(item) }}</td>
                <td>{{ item.contrato?.num_contrato ?? item.contrato?.contratos_id ?? 'Sin contrato' }}</td>
                <td>{{ formatoDireccion(item.direccion_cobro) }}</td>
                <td>
                  <span v-if="visitaDelCiclo(item)" class="badge" :class="resultadoClass(item.detalle.resultado)">
                    {{ item.detalle.resultado }}
                  </span>
                  <span v-else class="badge bg-light text-dark">Sin captura</span>
                </td>
                <td class="fw-semibold">{{ formatoMoneda(visitaDelCiclo(item) ? item.detalle.monto_recibido : 0) }}</td>
                <td>
                  <span v-if="item.pago" class="badge bg-info text-dark">
                    {{ item.pago.estatus ?? item.pago.estado }}
                  </span>
                  <span v-else class="text-muted">No aplica</span>
                </td>
                <td class="text-end">
                  <span v-if="visitaRevisada(item)" class="badge bg-success">Revisada</span>
                  <div v-else-if="pagoPendiente(item)" class="d-flex justify-content-end gap-2">
                    <button class="btn btn-sm btn-success" @click="revisar(item, 'validado')" :disabled="procesando">
                      Aprobar
                    </button>
                    <button class="btn btn-sm btn-outline-danger" @click="revisar(item, 'cancelado')" :disabled="procesando">
                      Rechazar
                    </button>
                  </div>
                  <button v-else class="btn btn-sm btn-outline-secondary" @click="revisar(item)" :disabled="procesando || !visitaDelCiclo(item)">
                    Marcar revisada
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </template>
  </div>
</template>

<style scoped>
.metric {
  background: #fff;
  border: 1px solid #e5edf2;
  border-radius: 8px;
  padding: 14px;
  box-shadow: 0 2px 12px rgba(47, 65, 86, 0.08);
}

.metric span {
  display: block;
  color: #667085;
  font-size: 0.82rem;
  font-weight: 600;
}

.metric strong {
  color: var(--primary);
}

.thead-custom th {
  background: var(--primary);
  color: #fff;
  font-weight: 600;
  padding: 12px 16px;
}
</style>
