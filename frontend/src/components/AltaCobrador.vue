<script setup>
import { ref, reactive } from 'vue'
import { cobradorModel, cobradorSchema } from '@/schemas'
import api from '@/services/api'

const emit = defineEmits(['guardado', 'cancelado'])

const form = reactive({
  nombre: '',
  apaterno: '',
  amaterno: '',
  email: '',
  password: '',
  direccion: '',
  telefono: '',
})

const errores = ref({})
const enviando = ref(false)
const mensajeExito = ref('')
const mensajeError = ref('')

async function validar() {
  errores.value = {}
  const requeridos = { nombre: 3, apaterno: 3, email: 0, password: 6, direccion: 4, telefono: 7 }
  let valido = true

  for (const [campo, min] of Object.entries(requeridos)) {
    if (!form[campo] || form[campo].length < min) {
      errores.value[campo] = min > 0
        ? `Mínimo ${min} caracteres`
        : 'Campo obligatorio'
      valido = false
    }
  }

  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errores.value.email = 'Email inválido'
    valido = false
  }

  return valido
}

async function guardar() {
  mensajeExito.value = ''
  mensajeError.value = ''

  const esValido = await validar()
  if (!esValido) return

  enviando.value = true
  try {
    const payload = {
      usuario: {
        nombre: form.nombre,
        apaterno: form.apaterno,
        amaterno: form.amaterno,
        email: form.email,
        password: form.password,
      },
      cobrador: {
        nombre: form.nombre,
        direccion: form.direccion,
        telefono: form.telefono,
      }
    }

    const { data } = await api.post('/administrativos/alta-cobrador', payload)
    mensajeExito.value = 'Cobrador registrado correctamente'
    emit('guardado', data)
    limpiar()
  } catch (err) {
    mensajeError.value = err.response?.data?.message || 'Error al guardar el cobrador'
  } finally {
    enviando.value = false
  }
}

function limpiar() {
  Object.assign(form, {
    nombre: '', apaterno: '', amaterno: '',
    email: '', password: '', direccion: '', telefono: ''
  })
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
          maxlength="100"
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
          maxlength="100"
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
          maxlength="100"
        />
      </div>
    </div>

    <h5 class="mb-3">Acceso al sistema</h5>
    <div class="row g-3 mb-4">
      <div class="col-md-6">
        <label for="email" class="form-label">Email <span class="text-danger">*</span></label>
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
      <div class="col-md-6">
        <label for="password" class="form-label">Contraseña <span class="text-danger">*</span></label>
        <input
          id="password"
          v-model="form.password"
          type="password"
          class="form-control"
          :class="{ 'is-invalid': errores.password }"
          placeholder="Mínimo 6 caracteres"
        />
        <div class="invalid-feedback">{{ errores.password }}</div>
      </div>
    </div>

    <h5 class="mb-3">Datos del cobrador</h5>
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
        {{ enviando ? 'Guardando...' : 'Guardar cobrador' }}
      </button>
    </div>
  </form>
</template>