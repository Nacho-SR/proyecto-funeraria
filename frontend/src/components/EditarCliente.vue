<script setup>
import { ref, reactive, onMounted } from 'vue'
import { clienteSchema } from '@/schemas'
import { clienteService } from '@/services/cliente.service'
import { useRoute } from 'vue-router'

const route = useRoute()
const emit = defineEmits(['guardado', 'cancelado'])

const form = reactive({
  nombre: '',
  apaterno: '',
  amaterno: '',
  telefono: '',
  email: '',
  calle: '',
  colonia: '',
  numCasa: '',
})

const errores = ref({})
const enviando = ref(false)
const cargando = ref(true)
const mensajeExito = ref('')
const mensajeError = ref('')

onMounted(async () => {
  try {
    const { data } = await clienteService.obtener(route.params.id)
    Object.assign(form, {
      nombre: data.nombre ?? '',
      apaterno: data.apaterno ?? '',
      amaterno: data.amaterno ?? '',
      telefono: data.telefono ?? '',
      email: data.email ?? '',
      calle: data.calle ?? '',
      colonia: data.colonia ?? '',
      numCasa: data.numCasa ?? '',
    })
  } catch {
    mensajeError.value = 'No se pudo cargar la información del cliente'
  } finally {
    cargando.value = false
  }
})

async function validar() {
  errores.value = {}
  try {
    await clienteSchema.validate(form, { abortEarly: false })
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
      telefono: form.telefono,
      calle: form.calle,
      colonia: form.colonia,
      numCasa: form.numCasa,
    }
    const { data } = await clienteService.actualizar(route.params.id, payload)
    mensajeExito.value = 'Cliente actualizado correctamente'
    emit('guardado', data)
  } catch (err) {
    mensajeError.value = err.response?.data?.message || 'Error al actualizar el cliente'
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

    <h5 class="mb-3">Datos personales</h5>
    <div class="row g-3 mb-4">
      <div class="col-md-4">
        <label class="form-label">Nombre</label>
        <input
          v-model="form.nombre"
          type="text"
          class="form-control"
          disabled
        />
      </div>
      <div class="col-md-4">
        <label class="form-label">Apellido paterno</label>
        <input
          v-model="form.apaterno"
          type="text"
          class="form-control"
          disabled
        />
      </div>
      <div class="col-md-4">
        <label class="form-label">Apellido materno</label>
        <input
          v-model="form.amaterno"
          type="text"
          class="form-control"
          disabled
        />
      </div>
    </div>

    <h5 class="mb-3">Contacto</h5>
    <div class="row g-3 mb-4">
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
        <label for="email" class="form-label">Email</label>
        <input
          id="email"
          v-model="form.email"
          type="email"
          class="form-control"
          disabled
        />
      </div>
    </div>

    <h5 class="mb-3">Domicilio</h5>
    <div class="row g-3 mb-4">
      <div class="col-md-6">
        <label for="calle" class="form-label">Calle <span class="text-danger">*</span></label>
        <input
          id="calle"
          v-model="form.calle"
          type="text"
          class="form-control"
          :class="{ 'is-invalid': errores.calle }"
        />
        <div class="invalid-feedback">{{ errores.calle }}</div>
      </div>
      <div class="col-md-4">
        <label for="colonia" class="form-label">Colonia <span class="text-danger">*</span></label>
        <input
          id="colonia"
          v-model="form.colonia"
          type="text"
          class="form-control"
          :class="{ 'is-invalid': errores.colonia }"
        />
        <div class="invalid-feedback">{{ errores.colonia }}</div>
      </div>
      <div class="col-md-2">
        <label for="numCasa" class="form-label"># <span class="text-danger">*</span></label>
        <input
          id="numCasa"
          v-model="form.numCasa"
          type="text"
          class="form-control"
          :class="{ 'is-invalid': errores.numCasa }"
          maxlength="10"
        />
        <div class="invalid-feedback">{{ errores.numCasa }}</div>
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