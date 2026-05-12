<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { login, esAdmin } = useAuth()

const form = reactive({ correo: '', password: '' })
const error = ref('')
const cargando = ref(false)

async function iniciarSesion() {
  error.value = ''
  cargando.value = true
  try {
    // TODO: reemplazar con llamada real a la API
    // const { data } = await api.post('/auth/login', form)
    // login(data.usuario, data.token)

    // Demo: simula login según correo
    const esAdminDemo = form.correo.includes('admin')
    const usuarioDemo = {
      nombre: esAdminDemo ? 'Administrador' : 'Juan López',
      correo: form.correo,
      rol: esAdminDemo ? 'admin' : 'usuario',
    }
    login(usuarioDemo, 'demo-token-123')

    // Redirigir según rol
    if (esAdmin.value) {
      router.push({ name: 'dashboard-admin' })
    } else {
      router.push({ name: 'dashboard-usuario' })
    }
  } catch {
    error.value = 'Correo o contraseña incorrectos.'
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
          <input v-model="form.correo" type="email" class="form-control" placeholder="ejemplo@correo.com" required />
        </div>
        <div class="mb-4">
          <label class="form-label">Contraseña</label>
          <input v-model="form.password" type="password" class="form-control" placeholder="••••••••" required />
        </div>
        <button class="btn btn-custom w-100" :disabled="cargando">
          <span v-if="cargando" class="spinner-border spinner-border-sm me-2"></span>
          {{ cargando ? 'Entrando…' : 'Entrar' }}
        </button>
      </form>

      <p class="text-center mt-3 small text-muted">
        Demo: usa <strong>admin@...</strong> para rol administrador,<br>cualquier otro correo para usuario.
      </p>
    </div>
  </div>
</template>
