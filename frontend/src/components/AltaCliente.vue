<script setup>
import { ref, reactive } from 'vue'
import { clienteModel, clienteSchema } from '@/schemas'
import { clienteService } from '@/services/cliente.service'

const emit = defineEmits(['guardado', 'cancelado'])

const form = reactive(clienteModel())
const errores = ref({})
const enviando = ref(false)
const mensajeExito = ref('')
const mensajeError = ref('')

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
    const { data } = await clienteService.crear(form)
    mensajeExito.value = `Cliente "${data.nombre}" registrado correctamente`
    emit('guardado', data)
    limpiar()
  } catch (err) {
    mensajeError.value =
      err.response?.data?.message || 'Error al guardar el cliente'
  } finally {
    enviando.value = false
  }
}

function limpiar() {
  Object.assign(form, clienteModel())
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

    <h5 class="mb-3">Datos personales</h5>
    <div class="row g-3 mb-4">
      <div class="col-md-4">
        <label for="nombre" class="form-label">Nombre <span class="text-danger">*</span></label>
        <input
          id="nombre"
          v-model="form.nombre"
          type="text"
          class="form-control"
          :class="{ 'is-invalid': errores.nombre }"
          maxlength="50"
        />
        <div class="invalid-feedback">{{ errores.nombre }}</div>
      </div>
      <div class="col-md-4">
        <label for="apaterno" class="form-label">Apellido paterno <span class="text-danger">*</span></label>
        <input
          id="apaterno"
          v-model="form.apaterno"
          type="text"
          class="form-control"
          :class="{ 'is-invalid': errores.apaterno }"
          maxlength="50"
        />
        <div class="invalid-feedback">{{ errores.apaterno }}</div>
      </div>
      <div class="col-md-4">
        <label for="amaterno" class="form-label">Apellido materno</label>
        <input
          id="amaterno"
          v-model="form.amaterno"
          type="text"
          class="form-control"
          :class="{ 'is-invalid': errores.amaterno }"
          maxlength="50"
        />
        <div class="invalid-feedback">{{ errores.amaterno }}</div>
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
          :class="{ 'is-invalid': errores.email }"
          placeholder="ejemplo@correo.com"
        />
        <div class="invalid-feedback">{{ errores.email }}</div>
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
      <button type="submit" class="btn btn-primary" :disabled="enviando">
        <span v-if="enviando" class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
        {{ enviando ? 'Guardando...' : 'Guardar cliente' }}
      </button>
    </div>
  </form>
</template>
