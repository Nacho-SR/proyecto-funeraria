<script setup>
import { ref, reactive, onMounted } from 'vue'
import { contratoSchema, FRECUENCIAS_PAGO, ESTADOS_CONTRATO } from '@/schemas'
import { contratoService } from '@/services/contrato.service'
import { clienteService } from '@/services/cliente.service'
import { paqueteService } from '@/services/paquete.service'

const emit = defineEmits(['guardado', 'cancelado'])

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
    clientes.value = resClientes.data?.clientes ?? resClientes.data
    paquetes.value = resPaquetes.data?.paquetes ?? resPaquetes.data
  } catch {
    mensajeError.value = 'Error al cargar clientes o paquetes'
  } finally {
    cargando.value = false
  }
})

async function validar() {
  errores.value = {}
  try {
    await contratoSchema.validate(form, { abortEarly: false })
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

  const esValido = await validar()
  if (!esValido) return

  enviando.value = true
  try {
    const { data } = await contratoService.crear({ ...form })
    mensajeExito.value = 'Contrato registrado correctamente'
    emit('guardado', data)
    limpiar()
  } catch (err) {
    mensajeError.value = err.response?.data?.message || 'Error al guardar el contrato'
  } finally {
    enviando.value = false
  }
}

function limpiar() {
  Object.assign(form, {
    numContrato: '',
    id_cliente: null,
    id_paquete: null,
    fechaInicio: '',
    frecuenciaPago: 'mensual',
    diaPago: 1,
    precioTotal: 0,
    estado: 'activo',
  })
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

    <h5 class="mb-3">Datos del contrato</h5>
    <div class="row g-3 mb-4">
      <div class="col-md-4">
        <label for="numContrato" class="form-label">Número de contrato <span class="text-danger">*</span></label>
        <input
          id="numContrato"
          v-model="form.numContrato"
          type="text"
          class="form-control"
          :class="{ 'is-invalid': errores.numContrato }"
          maxlength="20"
        />
        <div class="invalid-feedback">{{ errores.numContrato }}</div>
      </div>
      <div class="col-md-4">
        <label for="fechaInicio" class="form-label">Fecha de inicio <span class="text-danger">*</span></label>
        <input
          id="fechaInicio"
          v-model="form.fechaInicio"
          type="date"
          class="form-control"
          :class="{ 'is-invalid': errores.fechaInicio }"
        />
        <div class="invalid-feedback">{{ errores.fechaInicio }}</div>
      </div>
      <div class="col-md-4">
        <label for="estado" class="form-label">Estado <span class="text-danger">*</span></label>
        <select
          id="estado"
          v-model="form.estado"
          class="form-select"
          :class="{ 'is-invalid': errores.estado }"
        >
          <option v-for="e in ESTADOS_CONTRATO" :key="e" :value="e">{{ e }}</option>
        </select>
        <div class="invalid-feedback">{{ errores.estado }}</div>
      </div>
    </div>

    <h5 class="mb-3">Cliente y paquete</h5>
    <div class="row g-3 mb-4">
      <div class="col-md-6">
        <label for="id_cliente" class="form-label">Cliente <span class="text-danger">*</span></label>
        <select
          id="id_cliente"
          v-model="form.id_cliente"
          class="form-select"
          :class="{ 'is-invalid': errores.id_cliente }"
        >
          <option :value="null" disabled>Selecciona un cliente</option>
          <option v-for="c in clientes" :key="c.id" :value="c.id">
            {{ c.nombre }} {{ c.apaterno }}
          </option>
        </select>
        <div class="invalid-feedback">{{ errores.id_cliente }}</div>
      </div>
      <div class="col-md-6">
        <label for="id_paquete" class="form-label">Paquete <span class="text-danger">*</span></label>
        <select
          id="id_paquete"
          v-model="form.id_paquete"
          class="form-select"
          :class="{ 'is-invalid': errores.id_paquete }"
        >
          <option :value="null" disabled>Selecciona un paquete</option>
          <option v-for="p in paquetes" :key="p.id" :value="p.id">
            {{ p.nombre }}
          </option>
        </select>
        <div class="invalid-feedback">{{ errores.id_paquete }}</div>
      </div>
    </div>

    <h5 class="mb-3">Pago</h5>
    <div class="row g-3 mb-4">
      <div class="col-md-4">
        <label for="frecuenciaPago" class="form-label">Frecuencia de pago <span class="text-danger">*</span></label>
        <select
          id="frecuenciaPago"
          v-model="form.frecuenciaPago"
          class="form-select"
          :class="{ 'is-invalid': errores.frecuenciaPago }"
        >
          <option v-for="f in FRECUENCIAS_PAGO" :key="f" :value="f">{{ f }}</option>
        </select>
        <div class="invalid-feedback">{{ errores.frecuenciaPago }}</div>
      </div>
      <div class="col-md-4">
        <label for="diaPago" class="form-label">Día de pago <span class="text-danger">*</span></label>
        <input
          id="diaPago"
          v-model.number="form.diaPago"
          type="number"
          class="form-control"
          :class="{ 'is-invalid': errores.diaPago }"
          min="1"
          max="31"
        />
        <div class="invalid-feedback">{{ errores.diaPago }}</div>
      </div>
      <div class="col-md-4">
        <label for="precioTotal" class="form-label">Precio total <span class="text-danger">*</span></label>
        <input
          id="precioTotal"
          v-model.number="form.precioTotal"
          type="number"
          class="form-control"
          :class="{ 'is-invalid': errores.precioTotal }"
          min="0"
          step="0.01"
        />
        <div class="invalid-feedback">{{ errores.precioTotal }}</div>
      </div>
    </div>

    <div class="d-flex justify-content-end gap-2">
      <button type="button" class="btn btn-outline-secondary" @click="cancelar" :disabled="enviando">
        Cancelar
      </button>
      <button type="submit" class="btn btn-custom" :disabled="enviando">
        <span v-if="enviando" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
        {{ enviando ? 'Guardando...' : 'Guardar contrato' }}
      </button>
    </div>
  </form>
</template>