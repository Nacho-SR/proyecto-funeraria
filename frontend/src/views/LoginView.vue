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
  rol: 'admin',
})

const error = ref('')
const cargando = ref(false)

async function iniciarSesion() {
  error.value = ''
  cargando.value = true
  try {
    const { data } = await api.post('/auth/login', {
      email: form.correo,
      password: form.password,
      role: form.rol,
    })

    login(
      { nombre: data.email, correo: data.email, rol: data.role },
      data.token
    )

    if (data.role === 'admin') {
      router.push({ name: 'dashboard-admin' })
    } else {
      router.push({ name: 'dashboard-usuario' })
    }
  } catch (err) {
    error.value = err.response?.data?.message || 'Correo, contraseña o rol incorrectos.'
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-card shadow-lg">
      <h2 class="text-center mb-4 title-login">Iniciar Sesión</h2>

      <div v-if="error" class="alert alert-danger">{{ error }}</div>

      <form @submit.prevent="iniciarSesion">

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
          <label class="form-label">Rol</label>
          <select v-model="form.rol" class="form-control">
            <option value="admin">Administrador</option>
            <option value="cobrador">Cobrador</option>
            <option value="cliente">Cliente</option>
          </select>
        </div>

        <button class="btn btn-custom w-100" :disabled="cargando">
          <span v-if="cargando" class="spinner-border spinner-border-sm me-2"></span>
          {{ cargando ? 'Entrando…' : 'Entrar' }}
        </button>

      </form>
    </div>
  </div>
</template>