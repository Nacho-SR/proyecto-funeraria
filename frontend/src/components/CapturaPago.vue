<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { pagoSchema, pagoModel } from '@/schemas'
import { pagoService } from '@/services/pago.service'
import api from '@/services/api'

const emit = defineEmits(['guardado', 'cancelado'])

const form = reactive(pagoModel())
const contratos = ref([])
const errores = ref({})
const enviando = ref(false)
const cargando = ref(true)
const mensajeExito = ref('')
const mensajeError = ref('')

const contratoSeleccionado = computed(() =>
  contratos.value.find(c => (c.contratos_id ?? c.contratoID ?? c.id) === form.contratoID) ?? null
)

const precioFinal = computed(() => Number(contratoSeleccionado.value?.precio_final ?? 0))
const abonado = computed(() => Number(contratoSeleccionado.value?.abonado ?? 0))
const saldoPendiente = computed(() => Math.max(precioFinal.value - abonado.value, 0))
const contratoPagado = computed(() => !!contratoSeleccionado.value && saldoPendiente.value <= 0)

const nombreCliente = computed(() => {
  const usuario = contratoSeleccionado.value?.cliente?.usuario
  if (!usuario) return 'Sin cliente'
  return [usuario.nombre, usuario.apaterno, usuario.amaterno].filter(Boolean).join(' ')
})

const direccionCliente = computed(() => {
  const cliente = contratoSeleccionado.value?.cliente?.cliente
  return formatoDireccion(cliente)
})

const direccionCobro = computed(() => formatoDireccion(contratoSeleccionado.value?.direccion_cobro))

function formatoMoneda(valor) {
  return Number(valor ?? 0).toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN'
  })
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

onMounted(async () => {
  try {
    await cargarContratos()
  } catch {
    mensajeError.value = 'Error al cargar la lista de contratos'
  } finally {
    cargando.value = false
  }
})

async function cargarContratos() {
  const { data } = await api.get('/administrativos/info-contratos')
  contratos.value = data?.contratos ?? data ?? []
}

async function validar() {
  errores.value = {}
  try {
    await pagoSchema.validate(form, { abortEarly: false })
    return true
  } catch (err) {
    if (err.inner) {
      err.inner.forEach((e) => {
        errores.value[e.path] = e.message
      })
    }
    return false
  }
}

async function guardar() {
  mensajeExito.value = ''
  mensajeError.value = ''

  if (contratoPagado.value) {
    mensajeError.value = 'Este contrato ya esta completamente pagado'
    return
  }

  if (Number(form.monto) > saldoPendiente.value) {
    errores.value = { monto: 'El monto no puede superar el saldo pendiente' }
    return
  }

  const esValido = await validar()
  if (!esValido) return

  enviando.value = true
  try {
    const { data } = await pagoService.crear({
      contratos_id: form.contratoID,
      monto: form.monto,
    })
    mensajeExito.value = 'Pago registrado correctamente'
    emit('guardado', data)
    limpiar()

    try {
      await cargarContratos()
    } catch {
      mensajeError.value = 'Pago registrado, pero no se pudo actualizar la lista de contratos'
    }
  } catch (err) {
    mensajeError.value = err.response?.data?.message || 'Error al guardar el pago'
  } finally {
    enviando.value = false
  }
}

function limpiar() {
  Object.assign(form, pagoModel())
  errores.value = {}
}

function cancelar() {
  limpiar()
  emit('cancelado')
}
</script>

<template>
  <div v-if="cargando" class="text-center py-4">
    <div class="spinner-border text-secondary" role="status"></div>
  </div>

  <form v-else @submit.prevent="guardar" novalidate>
    <div v-if="mensajeExito" class="alert alert-success" role="alert">
      {{ mensajeExito }}
    </div>
    <div v-if="mensajeError" class="alert alert-danger" role="alert">
      {{ mensajeError }}
    </div>

    <h5 class="mb-3">Datos del pago</h5>
    <div class="row g-3 mb-4">
      <div class="col-md-6">
        <label for="contratoID" class="form-label">Contrato <span class="text-danger">*</span></label>
        <select
          id="contratoID"
          v-model="form.contratoID"
          class="form-select"
          :class="{ 'is-invalid': errores.contratoID }"
        >
          <option :value="null" disabled>Selecciona un contrato</option>
          <option v-for="c in contratos" :key="c.contratos_id ?? c.contratoID ?? c.id" :value="c.contratos_id ?? c.contratoID ?? c.id">
            {{ c.num_contrato ?? c.numContrato ?? `Contrato ${c.contratos_id ?? c.contratoID ?? c.id}` }}
          </option>
        </select>
        <div class="invalid-feedback">{{ errores.contratoID }}</div>
      </div>
    </div>

    <div v-if="contratoSeleccionado" class="contrato-resumen mb-4">
      <div class="resumen-header">
        <div>
          <h6 class="fw-bold mb-1">Informacion del contrato</h6>
          <p class="text-muted mb-0">{{ contratoSeleccionado.num_contrato ?? 'Sin numero de contrato' }}</p>
        </div>
        <span class="badge" :class="contratoPagado ? 'bg-success' : 'bg-warning text-dark'">
          {{ contratoPagado ? 'Pagado' : 'Saldo pendiente' }}
        </span>
      </div>

      <div class="row g-3 mt-1">
        <div class="col-md-6">
          <div class="detalle-label">Cliente</div>
          <div class="detalle-value">{{ nombreCliente }}</div>
        </div>
        <div class="col-md-6">
          <div class="detalle-label">Paquete</div>
          <div class="detalle-value">{{ contratoSeleccionado.paquete?.nombre ?? 'Sin paquete' }}</div>
        </div>
        <div class="col-md-6">
          <div class="detalle-label">Direccion del cliente</div>
          <div class="detalle-value">{{ direccionCliente }}</div>
        </div>
        <div class="col-md-6">
          <div class="detalle-label">Direccion de cobro</div>
          <div class="detalle-value">{{ direccionCobro }}</div>
        </div>
        <div class="col-md-4">
          <div class="detalle-label">Precio final</div>
          <div class="detalle-value fw-bold">{{ formatoMoneda(precioFinal) }}</div>
        </div>
        <div class="col-md-4">
          <div class="detalle-label">Abonado</div>
          <div class="detalle-value fw-bold">{{ formatoMoneda(abonado) }}</div>
        </div>
        <div class="col-md-4">
          <div class="detalle-label">Saldo pendiente</div>
          <div class="detalle-value fw-bold">{{ formatoMoneda(saldoPendiente) }}</div>
        </div>
      </div>
    </div>

    <h5 class="mb-3">Monto</h5>
    <div class="row g-3 mb-4">
      <div class="col-md-6">
        <label for="monto" class="form-label">Monto <span class="text-danger">*</span></label>
        <input
          id="monto"
          v-model.number="form.monto"
          type="number"
          class="form-control"
          :class="{ 'is-invalid': errores.monto }"
          min="0"
          :max="saldoPendiente || undefined"
          step="0.01"
          placeholder="0.00"
          :disabled="!contratoSeleccionado || contratoPagado"
        />
        <div class="invalid-feedback">{{ errores.monto }}</div>
        <small v-if="contratoSeleccionado && !contratoPagado" class="text-muted">
          Maximo: {{ formatoMoneda(saldoPendiente) }}
        </small>
        <small v-if="contratoPagado" class="text-success d-block">
          Este contrato ya esta completamente pagado.
        </small>
      </div>
    </div>

    <div class="d-flex justify-content-end gap-2">
      <button type="button" class="btn btn-outline-secondary" @click="cancelar" :disabled="enviando">
        Cancelar
      </button>
      <button type="submit" class="btn btn-custom" :disabled="enviando || !contratoSeleccionado || contratoPagado">
        <span v-if="enviando" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
        {{ enviando ? 'Guardando...' : 'Registrar pago' }}
      </button>
    </div>
  </form>
</template>

<style scoped>
.contrato-resumen {
  background: #fff;
  border: 1px solid #e7edf1;
  border-radius: 8px;
  padding: 18px;
}
.resumen-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid #edf1f4;
  padding-bottom: 12px;
}
.detalle-label {
  color: #667085;
  font-size: 0.82rem;
  font-weight: 600;
  margin-bottom: 2px;
}
.detalle-value {
  color: var(--primary);
  font-size: 0.95rem;
  overflow-wrap: anywhere;
}
</style>
