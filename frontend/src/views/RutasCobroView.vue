<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { rutasCobroService } from '@/services/rutasCobro.service'

const rutas = ref([])
const rutaActiva = ref(null)
const cargandoRutas = ref(false)
const cargandoRuta = ref(false)
const enviando = ref(false)
const error = ref('')
const exito = ref('')
const modalConfirmacion = ref(false)

const form = reactive({
  resultado: 'pagado',
  monto_recibido: 0
})

const resumenRuta = computed(() => rutaActiva.value?.resumen ?? {})
const detalles = computed(() => rutaActiva.value?.detalles ?? [])
const rutaTerminada = computed(() => detalles.value.length > 0 && pendientes.value.length === 0)
const pendientes = computed(() =>
  detalles.value.filter(item => !item.detalle?.resultado && !item.detalle?.fecha_realizacion)
)
const destinoActual = computed(() => pendientes.value[0] ?? null)
const destinoActualIndex = computed(() => {
  if (!destinoActual.value) return -1
  return detalles.value.findIndex(item => item.detalle.detalle_ruta_cobros_id === destinoActual.value.detalle.detalle_ruta_cobros_id)
})

const titularActual = computed(() => nombreTitular(destinoActual.value))
const contratoActual = computed(() => destinoActual.value?.contrato ?? null)
const direccionActual = computed(() => formatoDireccion(destinoActual.value?.direccion_cobro))
const saldoContrato = computed(() => {
  const contrato = contratoActual.value
  if (!contrato) return 0
  return Math.max(Number(contrato.precio_final ?? 0) - Number(contrato.abonado ?? 0), 0)
})

watch(() => form.resultado, (resultado) => {
  if (resultado !== 'pagado') {
    form.monto_recibido = 0
  }
})

onMounted(cargarRutas)

async function cargarRutas() {
  cargandoRutas.value = true
  error.value = ''
  try {
    const { data } = await rutasCobroService.listar()
    rutas.value = data?.rutas ?? []
  } catch (err) {
    error.value = err.response?.data?.message || 'No se pudieron cargar tus rutas de cobro.'
  } finally {
    cargandoRutas.value = false
  }
}

async function seleccionarRuta(ruta) {
  cargandoRuta.value = true
  error.value = ''
  exito.value = ''
  try {
    const { data } = await rutasCobroService.obtener(ruta.ruta_cobros_id)
    rutaActiva.value = data.ruta
    limpiarForm()
  } catch (err) {
    error.value = err.response?.data?.message || 'No se pudo cargar el detalle de la ruta.'
  } finally {
    cargandoRuta.value = false
  }
}

async function iniciarRuta(ruta) {
  cargandoRuta.value = true
  error.value = ''
  exito.value = ''
  try {
    const { data } = await rutasCobroService.iniciar(ruta.ruta_cobros_id)
    rutaActiva.value = data.ruta
    limpiarForm()
    await cargarRutas()
  } catch (err) {
    error.value = err.response?.data?.message || 'No se pudo iniciar la ruta.'
  } finally {
    cargandoRuta.value = false
  }
}

function prepararConfirmacion() {
  error.value = ''
  exito.value = ''

  if (!destinoActual.value) return

  if (form.resultado === 'pagado' && Number(form.monto_recibido) <= 0) {
    error.value = 'Ingresa un monto mayor a cero para registrar un resultado pagado.'
    return
  }

  modalConfirmacion.value = true
}

async function confirmarResultado() {
  if (!rutaActiva.value || !destinoActual.value) return

  enviando.value = true
  error.value = ''
  exito.value = ''
  try {
    const payload = {
      resultado: form.resultado,
      monto_recibido: form.resultado === 'pagado' ? Number(form.monto_recibido) : 0
    }
    const { data } = await rutasCobroService.registrarResultado(
      rutaActiva.value.ruta_cobros_id,
      destinoActual.value.detalle.detalle_ruta_cobros_id,
      payload
    )
    rutaActiva.value = data.ruta
    exito.value = data.rutaCompletada
      ? 'Ruta completada correctamente.'
      : 'Resultado registrado. Se muestra el siguiente destino.'
    modalConfirmacion.value = false
    limpiarForm()
    await cargarRutas()
  } catch (err) {
    error.value = err.response?.data?.message || 'No se pudo registrar el resultado.'
  } finally {
    enviando.value = false
  }
}

function limpiarForm() {
  form.resultado = 'pagado'
  form.monto_recibido = 0
}

function nombreTitular(item) {
  const usuario = item?.cliente?.usuario
  if (!usuario) return 'Cliente sin nombre'
  return [usuario.nombre, usuario.apaterno, usuario.amaterno].filter(Boolean).join(' ')
}

function telefonoCliente(item) {
  return item?.cliente?.cliente?.telefono ?? 'Sin telefono'
}

function formatoDireccion(direccion) {
  if (!direccion) return 'Sin direccion registrada'
  return [
    direccion.calle,
    direccion.num_casa,
    direccion.colonia,
    direccion.referencia,
    direccion.horario_atencion
  ].filter(Boolean).join(', ')
}

function formatoMoneda(valor) {
  return Number(valor ?? 0).toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN'
  })
}

function fechaLegible(valor) {
  if (!valor) return 'Sin fecha'
  const segundos = valor.seconds ?? valor._seconds
  const fecha = valor.toDate?.() ?? (segundos ? new Date(segundos * 1000) : new Date(valor))
  if (Number.isNaN(fecha.getTime())) return 'Sin fecha'
  return fecha.toLocaleDateString('es-MX')
}

function estadoClase(estado) {
  return {
    asignada: 'bg-secondary',
    'en curso': 'bg-info text-dark',
    completada: 'bg-success'
  }[estado] ?? 'bg-secondary'
}

function resultadoClase(resultado) {
  return {
    pagado: 'bg-success',
    pospuesto: 'bg-warning text-dark',
    NE: 'bg-secondary'
  }[resultado] ?? 'bg-light text-dark'
}
</script>

<template>
  <div class="container py-4 rutas-page">
    <div class="d-flex justify-content-between align-items-start gap-3 flex-wrap mb-4">
      <div>
        <h3 class="mb-1 fw-bold" style="color: var(--primary)">Rutas de cobro</h3>
        <small class="text-muted">Consulta tus rutas asignadas y registra el resultado de cada visita.</small>
      </div>
      <button class="btn btn-outline-secondary" @click="cargarRutas" :disabled="cargandoRutas">
        Actualizar
      </button>
    </div>

    <div v-if="error" class="alert alert-danger">{{ error }}</div>
    <div v-if="exito" class="alert alert-success">{{ exito }}</div>

    <div class="row g-4">
      <div class="col-lg-4">
        <div class="panel-lista">
          <div class="panel-lista__header">
            <h5 class="mb-0">Mis rutas</h5>
            <span class="badge bg-light text-dark">{{ rutas.length }}</span>
          </div>

          <div v-if="cargandoRutas" class="text-center py-4">
            <div class="spinner-border" style="color: var(--secondary)"></div>
          </div>

          <div v-else-if="rutas.length === 0" class="empty-state">
            No tienes rutas asignadas.
          </div>

          <div v-else class="ruta-list">
            <button
              v-for="ruta in rutas"
              :key="ruta.ruta_cobros_id"
              type="button"
              class="ruta-item"
              :class="{ activa: rutaActiva?.ruta_cobros_id === ruta.ruta_cobros_id }"
              @click="seleccionarRuta(ruta)"
            >
              <div class="ruta-item__top">
                <strong>{{ ruta.nombre }}</strong>
                <span class="badge" :class="estadoClase(ruta.estado)">{{ ruta.estado }}</span>
              </div>
              <div class="ruta-item__meta">
                {{ fechaLegible(ruta.fecha_inicio) }} · {{ ruta.periodicidad }}
              </div>
              <div class="progress ruta-progress mt-2" role="progressbar">
                <div
                  class="progress-bar"
                  :style="{ width: `${ruta.resumen?.total ? (ruta.resumen.completados / ruta.resumen.total) * 100 : 0}%` }"
                ></div>
              </div>
              <div class="ruta-item__meta mt-1">
                {{ ruta.resumen?.completados ?? 0 }} de {{ ruta.resumen?.total ?? 0 }} visitas
              </div>
            </button>
          </div>
        </div>
      </div>

      <div class="col-lg-8">
        <div v-if="!rutaActiva && !cargandoRuta" class="ruta-detalle empty-state">
          Selecciona una ruta para ver el recorrido.
        </div>

        <div v-else class="ruta-detalle">
          <div v-if="cargandoRuta" class="text-center py-5">
            <div class="spinner-border" style="color: var(--secondary)"></div>
          </div>

          <template v-else>
            <div class="ruta-detalle__header">
              <div>
                <h4 class="mb-1">{{ rutaActiva.nombre }}</h4>
                <small class="text-muted">{{ fechaLegible(rutaActiva.fecha_inicio) }} · {{ rutaActiva.periodicidad }}</small>
              </div>
              <span class="badge" :class="estadoClase(rutaActiva.estado)">{{ rutaActiva.estado }}</span>
            </div>

            <div class="row g-3 my-2">
              <div class="col-sm-4">
                <div class="metric">
                  <span>Total visitas</span>
                  <strong>{{ resumenRuta.total ?? 0 }}</strong>
                </div>
              </div>
              <div class="col-sm-4">
                <div class="metric">
                  <span>Pendientes</span>
                  <strong>{{ resumenRuta.pendientes ?? 0 }}</strong>
                </div>
              </div>
              <div class="col-sm-4">
                <div class="metric">
                  <span>Recibido</span>
                  <strong>{{ formatoMoneda(resumenRuta.monto_recibido) }}</strong>
                </div>
              </div>
            </div>

            <div v-if="rutaActiva.estado === 'asignada'" class="inicio-ruta">
              <p class="mb-0 text-muted">Inicia la ruta para comenzar a registrar visitas en el orden asignado.</p>
              <button class="btn btn-custom" @click="iniciarRuta(rutaActiva)" :disabled="cargandoRuta">
                Iniciar ruta
              </button>
            </div>

            <div v-else-if="rutaTerminada" class="empty-state">
              Esta ruta ya fue completada.
            </div>

            <div v-else-if="destinoActual" class="destino-actual">
              <div class="destino-actual__top">
                <div>
                  <span class="step-label">Destino {{ destinoActualIndex + 1 }} de {{ detalles.length }}</span>
                  <h5 class="mb-1">{{ titularActual }}</h5>
                  <small class="text-muted">Contrato {{ contratoActual?.num_contrato ?? contratoActual?.contratos_id ?? 'Sin contrato' }}</small>
                </div>
                <span class="badge bg-light text-dark">Orden {{ destinoActual.detalle.orden_visita }}</span>
              </div>

              <div class="info-grid">
                <div>
                  <span>Direccion de cobro</span>
                  <strong>{{ direccionActual }}</strong>
                </div>
                <div>
                  <span>Telefono titular</span>
                  <strong>{{ telefonoCliente(destinoActual) }}</strong>
                </div>
                <div>
                  <span>Saldo segun contrato</span>
                  <strong>{{ formatoMoneda(saldoContrato) }}</strong>
                </div>
              </div>

              <form class="resultado-form" @submit.prevent="prepararConfirmacion">
                <div class="row g-3">
                  <div class="col-md-6">
                    <label class="form-label" for="resultado">Resultado</label>
                    <select id="resultado" v-model="form.resultado" class="form-select">
                      <option value="pagado">Pagado</option>
                      <option value="pospuesto">Pospuesto</option>
                      <option value="NE">NE - No encontrado</option>
                    </select>
                  </div>
                  <div class="col-md-6">
                    <label class="form-label" for="monto_recibido">Monto recibido</label>
                    <input
                      id="monto_recibido"
                      v-model.number="form.monto_recibido"
                      type="number"
                      min="0"
                      step="0.01"
                      class="form-control"
                      :disabled="form.resultado !== 'pagado'"
                    />
                    <small v-if="form.resultado !== 'pagado'" class="text-muted">
                      El monto se registra automaticamente en 0.
                    </small>
                  </div>
                </div>

                <div class="d-flex justify-content-end mt-4">
                  <button class="btn btn-custom" type="submit" :disabled="enviando">
                    Registrar resultado
                  </button>
                </div>
              </form>
            </div>

            <div class="historial">
              <h6 class="fw-bold mb-3">Avance de la ruta</h6>
              <div class="historial-list">
                <div v-for="item in detalles" :key="item.detalle.detalle_ruta_cobros_id" class="historial-item">
                  <div>
                    <strong>{{ item.detalle.orden_visita }}. {{ nombreTitular(item) }}</strong>
                    <small>{{ item.contrato?.num_contrato ?? item.contrato?.contratos_id ?? 'Sin contrato' }}</small>
                  </div>
                  <span v-if="item.detalle.resultado" class="badge" :class="resultadoClase(item.detalle.resultado)">
                    {{ item.detalle.resultado }} · {{ formatoMoneda(item.detalle.monto_recibido) }}
                  </span>
                  <span v-else class="badge bg-light text-dark">Pendiente</span>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>

    <Teleport to="body">
      <div v-if="modalConfirmacion" class="modal-backdrop-custom" @click.self="modalConfirmacion = false">
        <div class="modal-confirmacion">
          <div class="modal-confirmacion__header">
            <h5 class="mb-0">Confirmar resultado</h5>
            <button class="btn-close" @click="modalConfirmacion = false" :disabled="enviando"></button>
          </div>
          <div class="modal-confirmacion__body">
            <p class="text-muted">
              Revisa la informacion antes de registrar la visita. Despues de confirmar no podra modificarse.
            </p>
            <div class="confirm-grid">
              <span>Titular</span>
              <strong>{{ titularActual }}</strong>
              <span>Contrato</span>
              <strong>{{ contratoActual?.num_contrato ?? contratoActual?.contratos_id ?? 'Sin contrato' }}</strong>
              <span>Direccion</span>
              <strong>{{ direccionActual }}</strong>
              <span>Resultado</span>
              <strong>{{ form.resultado }}</strong>
              <span>Monto recibido</span>
              <strong>{{ formatoMoneda(form.resultado === 'pagado' ? form.monto_recibido : 0) }}</strong>
            </div>
          </div>
          <div class="modal-confirmacion__footer">
            <button class="btn btn-outline-secondary" @click="modalConfirmacion = false" :disabled="enviando">
              Cancelar
            </button>
            <button class="btn btn-custom" @click="confirmarResultado" :disabled="enviando">
              <span v-if="enviando" class="spinner-border spinner-border-sm me-2"></span>
              {{ enviando ? 'Registrando...' : 'Confirmar' }}
            </button>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<style scoped>
.panel-lista,
.ruta-detalle {
  background: #fff;
  border: 1px solid #e5edf2;
  border-radius: 8px;
  padding: 18px;
  box-shadow: 0 2px 12px rgba(47, 65, 86, 0.08);
}

.panel-lista__header,
.ruta-detalle__header,
.destino-actual__top,
.inicio-ruta {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.ruta-list {
  display: grid;
  gap: 12px;
  margin-top: 16px;
}

.ruta-item {
  width: 100%;
  border: 1px solid #e5edf2;
  border-radius: 8px;
  padding: 14px;
  background: #fff;
  text-align: left;
  color: var(--primary);
  transition: border-color 0.15s, box-shadow 0.15s;
}

.ruta-item:hover,
.ruta-item.activa {
  border-color: var(--secondary);
  box-shadow: 0 4px 14px rgba(86, 124, 141, 0.16);
}

.ruta-item__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.ruta-item__meta,
.historial-item small {
  display: block;
  color: #667085;
  font-size: 0.82rem;
}

.ruta-progress {
  height: 6px;
  background: #edf2f5;
}

.ruta-progress .progress-bar {
  background: var(--secondary);
}

.empty-state {
  color: #667085;
  text-align: center;
  padding: 42px 20px;
}

.metric {
  border: 1px solid #e5edf2;
  border-radius: 8px;
  padding: 14px;
}

.metric span,
.info-grid span,
.confirm-grid span {
  display: block;
  color: #667085;
  font-size: 0.8rem;
  font-weight: 600;
  margin-bottom: 2px;
}

.metric strong {
  display: block;
  font-size: 1.1rem;
}

.inicio-ruta {
  border: 1px solid #e5edf2;
  border-radius: 8px;
  padding: 16px;
  margin: 18px 0;
}

.destino-actual {
  border-top: 1px solid #edf2f5;
  margin-top: 18px;
  padding-top: 18px;
}

.step-label {
  color: var(--secondary);
  font-size: 0.82rem;
  font-weight: 700;
  text-transform: uppercase;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin: 18px 0;
}

.info-grid div {
  background: #f8fafb;
  border: 1px solid #edf2f5;
  border-radius: 8px;
  padding: 12px;
}

.info-grid strong,
.confirm-grid strong {
  overflow-wrap: anywhere;
}

.resultado-form {
  border: 1px solid #e5edf2;
  border-radius: 8px;
  padding: 16px;
}

.historial {
  margin-top: 24px;
}

.historial-list {
  display: grid;
  gap: 10px;
}

.historial-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  border: 1px solid #edf2f5;
  border-radius: 8px;
  padding: 12px;
}

.modal-backdrop-custom {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1050;
  padding: 18px;
}

.modal-confirmacion {
  width: min(560px, 100%);
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 16px 48px rgba(0, 0, 0, 0.24);
}

.modal-confirmacion__header,
.modal-confirmacion__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 18px;
  border-bottom: 1px solid #edf2f5;
}

.modal-confirmacion__footer {
  justify-content: flex-end;
  border-top: 1px solid #edf2f5;
  border-bottom: 0;
}

.modal-confirmacion__body {
  padding: 18px;
}

.confirm-grid {
  display: grid;
  grid-template-columns: 130px 1fr;
  gap: 10px 16px;
}

@media (max-width: 768px) {
  .info-grid {
    grid-template-columns: 1fr;
  }

  .historial-item,
  .inicio-ruta,
  .destino-actual__top {
    align-items: stretch;
    flex-direction: column;
  }

  .confirm-grid {
    grid-template-columns: 1fr;
  }
}
</style>
