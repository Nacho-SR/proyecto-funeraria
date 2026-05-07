<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { paqueteModel, paqueteSchema } from '@/schemas'
import { paqueteService } from '@/services/paquete.service'

const emit = defineEmits(['guardado', 'cancelado'])

const form = reactive(paqueteModel())
const errores = ref({})
const enviando = ref(false)
const mensajeExito = ref('')
const mensajeError = ref('')

const adicionalesDisponibles = ref([])
const cargandoAdicionales = ref(false)

// Precio total = precioBase + suma de adicionales seleccionados
const precioConAdicionales = computed(() => {
  const base = Number(form.precioBase) || 0
  const extra = adicionalesDisponibles.value
    .filter((a) => form.adicionales.includes(a.adicionalesID))
    .reduce((sum, a) => sum + Number(a.precio || 0), 0)
  return base + extra
})

onMounted(async () => {
  cargandoAdicionales.value = true
  try {
    const { data } = await paqueteService.listarAdicionales()
    adicionalesDisponibles.value = data
  } catch (err) {
    mensajeError.value = 'No se pudieron cargar los adicionales'
  } finally {
    cargandoAdicionales.value = false
  }
})

async function validar() {
  errores.value = {}
  try {
    await paqueteSchema.validate(form, { abortEarly: false })
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
    const payload = {
      nombre: form.nombre,
      descripcion: form.descripcion,
      precioBase: Number(form.precioBase),
      adicionales: form.adicionales,
    }
    const { data } = await paqueteService.crear(payload)
    mensajeExito.value = `Paquete "${data.nombre}" registrado correctamente`
    emit('guardado', data)
    limpiar()
  } catch (err) {
    mensajeError.value =
      err.response?.data?.message || 'Error al guardar el paquete'
  } finally {
    enviando.value = false
  }
}

function toggleAdicional(id) {
  const idx = form.adicionales.indexOf(id)
  if (idx === -1) {
    form.adicionales.push(id)
  } else {
    form.adicionales.splice(idx, 1)
  }
}

function limpiar() {
  Object.assign(form, paqueteModel())
  errores.value = {}
}

function cancelar() {
  limpiar()
  emit('cancelado')
}
</script>

<template>
  <form @submit.prevent="guardar" novalidate>
    <div v-if="mensajeExito" class="alert alert-success" role="alert">
      {{ mensajeExito }}
    </div>
    <div v-if="mensajeError" class="alert alert-danger" role="alert">
      {{ mensajeError }}
    </div>

    <h5 class="mb-3">Información del paquete</h5>
    <div class="row g-3 mb-4">
      <div class="col-md-8">
        <label for="nombre" class="form-label">
          Nombre del paquete <span class="text-danger">*</span>
        </label>
        <input
          id="nombre"
          v-model="form.nombre"
          type="text"
          class="form-control"
          :class="{ 'is-invalid': errores.nombre }"
          placeholder="Ej. Paquete Tradicional"
          maxlength="100"
        />
        <div class="invalid-feedback">{{ errores.nombre }}</div>
      </div>
      <div class="col-md-4">
        <label for="precioBase" class="form-label">
          Precio base <span class="text-danger">*</span>
        </label>
        <div class="input-group">
          <span class="input-group-text">$</span>
          <input
            id="precioBase"
            v-model.number="form.precioBase"
            type="number"
            min="0"
            step="0.01"
            class="form-control"
            :class="{ 'is-invalid': errores.precioBase }"
          />
          <div class="invalid-feedback">{{ errores.precioBase }}</div>
        </div>
      </div>
      <div class="col-12">
        <label for="descripcion" class="form-label">
          Descripción <span class="text-danger">*</span>
        </label>
        <textarea
          id="descripcion"
          v-model="form.descripcion"
          class="form-control"
          :class="{ 'is-invalid': errores.descripcion }"
          rows="4"
          maxlength="500"
          placeholder="Detalle qué incluye el paquete..."
        ></textarea>
        <div class="invalid-feedback">{{ errores.descripcion }}</div>
        <small class="text-muted">{{ form.descripcion.length }}/500</small>
      </div>
    </div>

    <h5 class="mb-3">Adicionales incluidos <small class="text-muted">(opcional)</small></h5>
    <div v-if="cargandoAdicionales" class="text-center py-3">
      <div class="spinner-border text-primary" role="status">
        <span class="visually-hidden">Cargando...</span>
      </div>
    </div>
    <div v-else-if="adicionalesDisponibles.length === 0" class="alert alert-info">
      No hay adicionales registrados todavía.
    </div>
    <div v-else class="row g-2 mb-4">
      <div
        v-for="adic in adicionalesDisponibles"
        :key="adic.adicionalesID"
        class="col-md-6"
      >
        <div class="form-check border rounded p-2">
          <input
            :id="`adic-${adic.adicionalesID}`"
            type="checkbox"
            class="form-check-input"
            :checked="form.adicionales.includes(adic.adicionalesID)"
            @change="toggleAdicional(adic.adicionalesID)"
          />
          <label :for="`adic-${adic.adicionalesID}`" class="form-check-label w-100">
            <strong>{{ adic.nombre }}</strong>
            <span class="text-muted ms-2">${{ Number(adic.precio).toFixed(2) }}</span>
            <br />
            <small class="text-muted">{{ adic.descripcion }}</small>
          </label>
        </div>
      </div>
    </div>

    <div class="card bg-light mb-4">
      <div class="card-body d-flex justify-content-between align-items-center">
        <span class="fw-bold">Precio total estimado:</span>
        <span class="fs-4 text-success">${{ precioConAdicionales.toFixed(2) }}</span>
      </div>
    </div>

    <div class="d-flex justify-content-end gap-2">
      <button type="button" class="btn btn-outline-secondary" @click="cancelar" :disabled="enviando">
        Cancelar
      </button>
      <button type="submit" class="btn btn-primary" :disabled="enviando">
        <span v-if="enviando" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
        {{ enviando ? 'Guardando...' : 'Guardar paquete' }}
      </button>
    </div>
  </form>
</template>
