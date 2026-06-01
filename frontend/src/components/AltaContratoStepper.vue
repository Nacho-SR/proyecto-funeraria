<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { contratoSchema, FRECUENCIAS_PAGO, ESTADOS_CONTRATO } from '@/schemas'
import { contratoService } from '@/services/contrato.service'
import { clienteService } from '@/services/cliente.service'
import { paqueteService } from '@/services/paquete.service'

const emit = defineEmits(['guardado', 'cancelado'])

const pasoActual = ref(0)
const pasos = ['Información del cliente', 'Detalles del paquete', 'Confirmación']

const form = reactive({
  numContrato: '',
  id_cliente: null,
  id_paquete: null,
  fechaInicio: '',
  frecuenciaPago: 'mensual',
  diaPago: 1,
  precioTotal: 0,
  estado: 'activo',
})

const clientes = ref([])
const paquetes = ref([])
const errores = ref({})
const enviando = ref(false)
const cargando = ref(true)
const mensajeExito = ref('')
const mensajeError = ref('')

onMounted(async () => {
  try {
    const [resClientes, resPaquetes] = await Promise.all([
      clienteService.listar(),
      paqueteService.listar(),
    ])
    clientes.value = resClientes.data?.clientes ?? resClientes.data ?? []
    paquetes.value = resPaquetes.data?.paquetes ?? resPaquetes.data ?? []
  } catch {
    mensajeError.value = 'Error al cargar clientes o paquetes'
  } finally {
    cargando.value = false
  }
})

const progreso = computed(() =>
  pasoActual.value === 0 ? 0 : (pasoActual.value / (pasos.length - 1)) * 100
)

const nombreCliente = computed(() => {
  const c = clientes.value.find(x => (x.id ?? x.cliente_id) === form.id_cliente)
  return c ? `${c.nombre ?? c.usuario?.nombre ?? ''} ${c.apaterno ?? c.usuario?.apaterno ?? ''}`.trim() : '—'
})

const nombrePaquete = computed(() => {
  const p = paquetes.value.find(x => (x.id ?? x.paquete_id) === form.id_paquete)
  return p ? p.nombre : '—'
})

function siguiente() {
  if (pasoActual.value < pasos.length - 1) pasoActual.value++
}

function atras() {
  if (pasoActual.value > 0) pasoActual.value--
}

async function validar() {
  errores.value = {}
  try {
    await contratoSchema.validate(form, { abortEarly: false })
    return true
  } catch (err) {
    if (err.inner) {
      err.inner.forEach((e) => { errores.value[e.path] = e.message })
    }
    return false
  }
}

async function guardar() {
  mensajeExito.value = ''
  mensajeError.value = ''

  const esValido = await validar()
  if (!esValido) {
    pasoActual.value = 0
    return
  }

  enviando.value = true
  try {
    const { data } = await contratoService.crear({ ...form })
    mensajeExito.value = 'Contrato registrado correctamente'
    emit('guardado', data)
  } catch (err) {
    mensajeError.value = err.response?.data?.message || 'Error al guardar el contrato'
  } finally {
    enviando.value = false
  }
}

function cancelar() {
  emit('cancelado')
}
</script>

<template>
  <div v-if="cargando" class="text-center py-4">
    <div class="spinner-border text-secondary" role="status"></div>
  </div>

  <div v-else>
    <div v-if="mensajeExito" class="alert alert-success" role="alert">{{ mensajeExito }}</div>
    <div v-if="mensajeError" class="alert alert-danger" role="alert">{{ mensajeError }}</div>

    <div class="stepper-wrap mb-5">
      <div class="stepper-line-bg"></div>
      <div class="stepper-line-fill" :style="{ width: progreso + '%' }"></div>
      <div class="stepper-nodes">
        <div v-for="(paso, i) in pasos" :key="i" class="stepper-node">
          <div
            class="node-circle"
            :class="{
              'node-completado': i < pasoActual,
              'node-activo': i === pasoActual,
              'node-inactivo': i > pasoActual
            }"
          >
            <i v-if="i < pasoActual" class="bi bi-check-lg"></i>
            <span v-else>{{ i + 1 }}</span>
          </div>
          <span class="node-label" :class="{ 'text-muted': i > pasoActual }">{{ paso }}</span>
        </div>
      </div>
    </div>

    <div v-show="pasoActual === 0" class="paso-contenido">
      <h5 class="mb-3">Información del cliente</h5>
      <div class="row g-3">
        <div class="col-md-6">
          <label class="form-label">Número de contrato <span class="text-danger">*</span></label>
          <input v-model="form.numContrato" type="text" class="form-control" :class="{ 'is-invalid': errores.numContrato }" maxlength="20" />
          <div class="invalid-feedback">{{ errores.numContrato }}</div>
        </div>
        <div class="col-md-6">
          <label class="form-label">Cliente <span class="text-danger">*</span></label>
          <select v-model="form.id_cliente" class="form-select" :class="{ 'is-invalid': errores.id_cliente }">
            <option :value="null" disabled>Selecciona un cliente</option>
            <option v-for="c in clientes" :key="c.id ?? c.cliente_id" :value="c.id ?? c.cliente_id">
              {{ c.nombre ?? c.usuario?.nombre }} {{ c.apaterno ?? c.usuario?.apaterno }}
            </option>
          </select>
          <div class="invalid-feedback">{{ errores.id_cliente }}</div>
        </div>
        <div class="col-md-6">
          <label class="form-label">Fecha de inicio <span class="text-danger">*</span></label>
          <input v-model="form.fechaInicio" type="date" class="form-control" :class="{ 'is-invalid': errores.fechaInicio }" />
          <div class="invalid-feedback">{{ errores.fechaInicio }}</div>
        </div>
        <div class="col-md-6">
          <label class="form-label">Estado <span class="text-danger">*</span></label>
          <select v-model="form.estado" class="form-select">
            <option v-for="e in ESTADOS_CONTRATO" :key="e" :value="e">{{ e }}</option>
          </select>
        </div>
      </div>
    </div>

    <div v-show="pasoActual === 1" class="paso-contenido">
      <h5 class="mb-3">Detalles del paquete</h5>
      <div class="row g-3">
        <div class="col-md-6">
          <label class="form-label">Paquete <span class="text-danger">*</span></label>
          <select v-model="form.id_paquete" class="form-select" :class="{ 'is-invalid': errores.id_paquete }">
            <option :value="null" disabled>Selecciona un paquete</option>
            <option v-for="p in paquetes" :key="p.id ?? p.paquete_id" :value="p.id ?? p.paquete_id">
              {{ p.nombre }}
            </option>
          </select>
          <div class="invalid-feedback">{{ errores.id_paquete }}</div>
        </div>
        <div class="col-md-6">
          <label class="form-label">Frecuencia de pago <span class="text-danger">*</span></label>
          <select v-model="form.frecuenciaPago" class="form-select">
            <option v-for="f in FRECUENCIAS_PAGO" :key="f" :value="f">{{ f }}</option>
          </select>
        </div>
        <div class="col-md-6">
          <label class="form-label">Día de pago <span class="text-danger">*</span></label>
          <input v-model.number="form.diaPago" type="number" class="form-control" :class="{ 'is-invalid': errores.diaPago }" min="1" max="31" />
          <div class="invalid-feedback">{{ errores.diaPago }}</div>
        </div>
        <div class="col-md-6">
          <label class="form-label">Precio total <span class="text-danger">*</span></label>
          <input v-model.number="form.precioTotal" type="number" class="form-control" :class="{ 'is-invalid': errores.precioTotal }" min="0" step="0.01" />
          <div class="invalid-feedback">{{ errores.precioTotal }}</div>
        </div>
      </div>
    </div>

    <div v-show="pasoActual === 2" class="paso-contenido">
      <h5 class="mb-3">Confirmación</h5>
      <div class="resumen-card">
        <p class="fw-semibold mb-3">Resumen del contrato</p>
        <div class="resumen-row"><span class="text-muted">Número de contrato</span><span>{{ form.numContrato || '—' }}</span></div>
        <div class="resumen-row"><span class="text-muted">Cliente</span><span>{{ nombreCliente }}</span></div>
        <div class="resumen-row"><span class="text-muted">Paquete</span><span>{{ nombrePaquete }}</span></div>
        <div class="resumen-row"><span class="text-muted">Fecha de inicio</span><span>{{ form.fechaInicio || '—' }}</span></div>
        <div class="resumen-row"><span class="text-muted">Frecuencia</span><span class="text-capitalize">{{ form.frecuenciaPago }}</span></div>
        <div class="resumen-row"><span class="text-muted">Día de pago</span><span>{{ form.diaPago }}</span></div>
        <div class="resumen-row resumen-total"><span class="text-muted">Total</span><span class="fw-semibold">${{ Number(form.precioTotal).toLocaleString('es-MX') }}</span></div>
      </div>
    </div>

    <div class="d-flex justify-content-between mt-4">
      <button type="button" class="btn btn-outline-secondary" @click="pasoActual === 0 ? cancelar() : atras()" :disabled="enviando">
        {{ pasoActual === 0 ? 'Cancelar' : '← Atrás' }}
      </button>
      <button v-if="pasoActual < pasos.length - 1" type="button" class="btn btn-custom" @click="siguiente()">
        Siguiente →
      </button>
      <button v-else type="button" class="btn btn-custom" @click="guardar()" :disabled="enviando">
        <span v-if="enviando" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
        {{ enviando ? 'Guardando...' : 'Finalizar' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.stepper-wrap {
  position: relative;
  padding: 0 24px;
}
.stepper-line-bg {
  position: absolute;
  top: 19px;
  left: 48px;
  right: 48px;
  height: 3px;
  background: #e0e0e0;
  border-radius: 2px;
}
.stepper-line-fill {
  position: absolute;
  top: 19px;
  left: 48px;
  height: 3px;
  background: var(--primary, #2F4156);
  border-radius: 2px;
  transition: width 0.45s ease;
}
.stepper-nodes {
  position: relative;
  display: flex;
  justify-content: space-between;
}
.stepper-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}
.node-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: 500;
  background: #fff;
  transition: all 0.35s ease;
}
.node-inactivo {
  border: 2px solid #ccc;
  color: #999;
}
.node-activo {
  border: 2px solid var(--primary, #2F4156);
  color: var(--primary, #2F4156);
}
.node-completado {
  background: var(--primary, #2F4156);
  border: 2px solid var(--primary, #2F4156);
  color: #fff;
}
.node-label {
  font-size: 13px;
  font-weight: 500;
  text-align: center;
  max-width: 110px;
}
.paso-contenido {
  min-height: 220px;
}
.resumen-card {
  background: #f8f9fa;
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
}
.resumen-row {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  font-size: 14px;
}
.resumen-total {
  border-top: 1px solid #dee2e6;
  margin-top: 6px;
  padding-top: 12px;
}
</style>