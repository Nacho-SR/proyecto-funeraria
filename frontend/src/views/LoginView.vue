<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import api from '@/services/api'

const router = useRouter()
const { login } = useAuth()

const form = reactive({
  correo: '',
  password: '',
})

const error = ref('')
const cargando = ref(false)

function dashboardPorRol(rol) {
  if (rol === 'admin') return 'dashboard-admin'
  if (rol === 'cobrador') return 'dashboard-cobrador'
  return 'dashboard-cliente'
}

async function iniciarSesion() {
  error.value = ''
  cargando.value = true
  try {
    const { data } = await api.post('/auth/login', {
      email: form.correo,
      password: form.password,
    })

    login(data.usuario, data.token)
    router.push({ name: dashboardPorRol(data.usuario.rol) })
  } catch (err) {
    error.value = err.response?.data?.message || 'Correo o contrasena incorrectos.'
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-card shadow-lg">
      <h2 class="text-center mb-4 title-login">Iniciar Sesion</h2>

      <div v-if="error" class="alert alert-danger">{{ error }}</div>

      <form @submit.prevent="iniciarSesion">

        <div class="mb-3">
          <label class="form-label">Correo electronico</label>
          <input
            v-model="form.correo"
            type="email"
            class="form-control"
            placeholder="ejemplo@correo.com"
            required
          />
        </div>

        <div class="mb-4">
          <label class="form-label">Contrasena</label>
          <input
            v-model="form.password"
            type="password"
            class="form-control"
            placeholder="********"
            required
          />
        </div>

        <button class="btn btn-custom w-100" :disabled="cargando">
          <span v-if="cargando" class="spinner-border spinner-border-sm me-2"></span>
          {{ cargando ? 'Entrando...' : 'Entrar' }}
        </button>

      </form>
    </div>
  </div>
</template>
