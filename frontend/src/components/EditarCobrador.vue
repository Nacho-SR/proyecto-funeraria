<script setup>
import { ref, reactive, onMounted } from 'vue'
import { cobradorSchema } from '@/schemas'
import { cobradorService } from '@/services/cobrador.service'
import { useRoute } from 'vue-router'

const route = useRoute()
const emit = defineEmits(['guardado', 'cancelado'])

const form = reactive({
  nombre: '',
  direccion: '',
  telefono: '',
})

const errores = ref({})
const enviando = ref(false)
const cargando = ref(true)
const mensajeExito = ref('')
const mensajeError = ref('')

onMounted(async () => {
  try {
    const { data } = await cobradorService.obtener(route.params.id)
    Object.assign(form, {
      nombre: data.nombre ?? '',
      direccion: data.direccion ?? '',
      telefono: data.telefono ?? '',
    })
  } catch {
    mensajeError.value = 'No se pudo cargar la información del cobrador'
  } finally {
    cargando.value = false
  }
})

async function validar() {
  errores.value = {}
  try {
    await cobradorSchema.validate(form, { abortEarly: false })
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
    const { data } = await cobradorService.actualizar(route.params.id, {
      nombre: form.nombre,
      direccion: form.direccion,
      telefono: form.telefono,
    })
    mensajeExito.value = 'Cobrador actualizado correctamente'
    emit('guardado', data)
  } catch (err) {
    mensajeError.value = err.response?.data?.message || 'Error al actualizar el cobrador'
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

    <h5 class="mb-3">Datos del cobrador</h5>
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
      <div class="col-md-6">
        <label for="telefono" class="form-label">Teléfono <span class="text-danger">*</span></label>
        <input
          id="telefono"
          v-model="form.telefono"
          type="tel"
          class="form-control"
          :class="{ 'is-invalid': errores.telefono }"
          placeholder="10 dígitos"
          maxlength="10"
        />
        <div class="invalid-feedback">{{ errores.telefono }}</div>
      </div>
      <div class="col-md-6">
        <label for="direccion" class="form-label">Dirección <span class="text-danger">*</span></label>
        <input
          id="direccion"
          v-model="form.direccion"
          type="text"
          class="form-control"
          :class="{ 'is-invalid': errores.direccion }"
        />
        <div class="invalid-feedback">{{ errores.direccion }}</div>
      </div>
    </div>

    <div class="d-flex justify-content-end gap-2">
      <button type="button" class="btn btn-outline-secondary" @click="cancelar" :disabled="enviando">
        Cancelar
      </button>
      <button type="submit" class="btn btn-custom" :disabled="enviando">
        <span v-if="enviando" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
        {{ enviando ? 'Guardando...' : 'Guardar cambios' }}
      </button>
    </div>
  </form>
</template>