<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import api from '@/services/api'

const router = useRouter()

const form = reactive({
  nombre: '',
  correo: '',
  password: '',
  confirmar: '',
})

const error = ref('')
const cargando = ref(false)

async function registrar() {
  error.value = ''

  if (form.password !== form.confirmar) {
    error.value = 'Las contraseñas no coinciden.'
    return
  }

  if (form.password.length < 6) {
    error.value = 'La contraseña debe tener al menos 6 caracteres.'
    return
  }

  cargando.value = true
  try {
    await api.post('/usuarios/create', {
      email: form.correo,
      password: form.password,
      nombre: form.nombre,
      role: 'cliente',
    })

    router.push({ name: 'login' })
  } catch (err) {
    error.value = err.response?.data?.message || 'Error al crear la cuenta.'
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-card shadow-lg">

      <h2 class="text-center mb-4 title-login">Crear Cuenta</h2>

      <div v-if="error" class="alert alert-danger">{{ error }}</div>

      <form @submit.prevent="registrar">

        <div class="mb-3">
          <label class="form-label">Nombre completo</label>
          <input
            v-model="form.nombre"
            type="text"
            class="form-control"
            placeholder="Ingrese su nombre"
            required
          />
        </div>

        <div class="mb-3">
          <label class="form-label">Correo electrónico</label>
          <input
            v-model="form.correo"
            type="email"
            class="form-control"
            placeholder="ejemplo@correo.com"
            required
          />
        </div>

        <div class="mb-3">
          <label class="form-label">Contraseña</label>
          <input
            v-model="form.password"
            type="password"
            class="form-control"
            placeholder="••••••••"
            required
          />
        </div>

        <div class="mb-4">
          <label class="form-label">Confirmar contraseña</label>
          <input
            v-model="form.confirmar"
            type="password"
            class="form-control"
            placeholder="••••••••"
            required
          />
        </div>

        <button class="btn btn-custom w-100 mb-3" :disabled="cargando">
          <span v-if="cargando" class="spinner-border spinner-border-sm me-2"></span>
          {{ cargando ? 'Creando cuenta…' : 'Registrarse' }}
        </button>

        <div class="text-center">
          <router-link to="/login" class="text-decoration-none">
            ¿Ya tienes cuenta? Inicia sesión
          </router-link>
        </div>

      </form>
    </div>
  </div>
</template>