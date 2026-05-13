<script setup>
import { reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import api from '@/services/api'

const router = useRouter()
const { usuario, login, token } = useAuth()

const form = reactive({
  telefono: '',
  calle: '',
  colonia: '',
  numCasa: '',
  municipio: '',
})

const error = ref('')
const guardando = ref(false)

async function guardar() {
  error.value = ''

  if (!form.telefono || !form.calle || !form.colonia || !form.numCasa || !form.municipio) {
    error.value = 'Todos los campos son obligatorios.'
    return
  }

  if (!/^[0-9]{10}$/.test(form.telefono)) {
    error.value = 'El teléfono debe tener 10 dígitos.'
    return
  }

  guardando.value = true
  try {
    await api.post('/usuarios/perfil', {
      telefono: form.telefono,
      calle: form.calle,
      colonia: form.colonia,
      numCasa: form.numCasa,
      municipio: form.municipio,
    })

    const usuarioActualizado = { ...usuario.value, perfilCompleto: true, ...form }
    login(usuarioActualizado, token.value)

    router.push({ name: 'dashboard-usuario' })
  } catch (err) {
    error.value = err.response?.data?.message || 'Error al guardar el perfil.'
  } finally {
    guardando.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-card shadow-lg" style="max-width: 500px;">

      <h2 class="text-center mb-1 title-login">Completa tu perfil</h2>
      <p class="text-center text-muted mb-4 small">Solo necesitamos estos datos una vez.</p>

      <div v-if="error" class="alert alert-danger">{{ error }}</div>

      <form @submit.prevent="guardar">

        <div class="mb-3">
          <label class="form-label fw-semibold">Teléfono <span class="text-danger">*</span></label>
          <input
            v-model="form.telefono"
            type="tel"
            class="form-control"
            placeholder="10 dígitos"
            maxlength="10"
            required
          />
        </div>

        <div class="mb-3">
          <label class="form-label fw-semibold">Calle <span class="text-danger">*</span></label>
          <input
            v-model="form.calle"
            type="text"
            class="form-control"
            placeholder="Nombre de la calle"
            required
          />
        </div>

        <div class="mb-3">
          <label class="form-label fw-semibold">Colonia <span class="text-danger">*</span></label>
          <input
            v-model="form.colonia"
            type="text"
            class="form-control"
            placeholder="Colonia"
            required
          />
        </div>

        <div class="mb-3">
          <label class="form-label fw-semibold">Número de casa <span class="text-danger">*</span></label>
          <input
            v-model="form.numCasa"
            type="text"
            class="form-control"
            placeholder="Ej. 42B"
            maxlength="10"
            required
          />
        </div>

        <div class="mb-4">
          <label class="form-label fw-semibold">Municipio <span class="text-danger">*</span></label>
          <input
            v-model="form.municipio"
            type="text"
            class="form-control"
            placeholder="Ej. Salamanca"
            required
          />
        </div>

        <button class="btn btn-custom w-100" :disabled="guardando">
          <span v-if="guardando" class="spinner-border spinner-border-sm me-2"></span>
          {{ guardando ? 'Guardando…' : 'Continuar' }}
        </button>

      </form>
    </div>
  </div>
</template>