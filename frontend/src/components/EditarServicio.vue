<script setup>
import { ref, reactive, onMounted } from 'vue'
import * as yup from 'yup'
import { servicioService } from '@/services/otros.service'
import { useRoute } from 'vue-router'

const route = useRoute()
const emit = defineEmits(['guardado', 'cancelado'])

const form = reactive({
  nombre: '',
  descripcion: '',
  precio: '',
})

const errores = ref({})
const enviando = ref(false)
const cargando = ref(true)
const mensajeExito = ref('')
const mensajeError = ref('')

const servicioSchema = yup.object({
  nombre: yup
    .string()
    .required('El nombre es obligatorio')
    .max(100, 'Máximo 100 caracteres'),
  descripcion: yup
    .string()
    .max(500, 'Máximo 500 caracteres'),
  precio: yup
    .number()
    .typeError('El precio debe ser un número')
    .min(0, 'El precio no puede ser negativo')
    .required('El precio es obligatorio'),
})

onMounted(async () => {
  try {
    const { data } = await servicioService.obtener(route.params.id)
    Object.assign(form, {
      nombre: data.nombre ?? '',
      descripcion: data.descripcion ?? '',
      precio: data.precio ?? '',
    })
  } catch {
    mensajeError.value = 'No se pudo cargar la información del servicio'
  } finally {
    cargando.value = false
  }
})

async function validar() {
  errores.value = {}
  try {
    await servicioSchema.validate(form, { abortEarly: false })
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
    const { data } = await servicioService.actualizar(route.params.id, {
      nombre: form.nombre,
      descripcion: form.descripcion,
      precio: Number(form.precio),
    })
    mensajeExito.value = 'Servicio actualizado correctamente'
    emit('guardado', data)
  } catch (err) {
    mensajeError.value = err.response?.data?.message || 'Error al actualizar el servicio'
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

  <form v-else @submit.prevent="guardar" novalidate>
    <div v-if="mensajeExito" class="alert alert-success" role="alert">
      {{ mensajeExito }}
    </div>
    <div v-if="mensajeError" class="alert alert-danger" role="alert">
      {{ mensajeError }}
    </div>

    <h5 class="mb-3">Datos del servicio</h5>
    <div class="row g-3 mb-4">
      <div class="col-md-12">
        <label for="nombre" class="form-label">Nombre <span class="text-danger">*</span></label>
        <input
          id="nombre"
          v-model="form.nombre"
          type="text"
          class="form-control"
          :class="{ 'is-invalid': errores.nombre }"
          maxlength="100"
        />
        <div class="invalid-feedback">{{ errores.nombre }}</div>
      </div>
      <div class="col-md-12">
        <label for="precio" class="form-label">Precio <span class="text-danger">*</span></label>
        <input
          id="precio"
          v-model="form.precio"
          type="number"
          min="0"
          step="0.01"
          class="form-control"
          :class="{ 'is-invalid': errores.precio }"
        />
        <div class="invalid-feedback">{{ errores.precio }}</div>
      </div>
      <div class="col-12">
        <label for="descripcion" class="form-label">Descripción</label>
        <textarea
          id="descripcion"
          v-model="form.descripcion"
          class="form-control"
          :class="{ 'is-invalid': errores.descripcion }"
          rows="3"
          maxlength="500"
        ></textarea>
        <div class="invalid-feedback">{{ errores.descripcion }}</div>
      </div>
    </div>

    <div class="d-flex justify-content-end gap-2">
      <button type="button" class="btn btn-outline-secondary" @click="cancelar" :disabled="enviando">
        Cancelar
      </button>
      <button type="submit" class="btn btn-custom" :disabled="enviando">
        <span v-if="enviando" class="spinner-border spinner-border-sm me-2" role="status"></span>
        {{ enviando ? 'Guardando...' : 'Guardar cambios' }}
      </button>
    </div>
  </form>
</template>