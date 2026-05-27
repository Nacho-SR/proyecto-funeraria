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
  rol: 'cliente',
})

const error = ref('')
const exito = ref('')
const cargando = ref(false)

function limpiar() {
  form.nombre = ''
  form.correo = ''
  form.password = ''
  form.confirmar = ''
  form.rol = 'cliente'
}

async function registrar() {
  error.value = ''
  exito.value = ''

  if (form.password !== form.confirmar) {
    error.value = 'Las contrasenas no coinciden.'
    return
  }

  if (form.password.length < 6) {
    error.value = 'La contrasena debe tener al menos 6 caracteres.'
    return
  }

  cargando.value = true
  try {
    await api.post('/usuarios/create', {
      email: form.correo,
      password: form.password,
      nombre: form.nombre,
      rol: form.rol,
    })

    exito.value = 'Usuario creado correctamente.'
    limpiar()
  } catch (err) {
    error.value = err.response?.data?.message || 'Error al crear el usuario.'
  } finally {
    cargando.value = false
  }
}
</script>

<template>
  <div class="container py-4">
    <div class="row justify-content-center">
      <div class="col-lg-6">
        <div class="card shadow-sm">
          <div class="card-header bg-white">
            <h4 class="mb-0 fw-bold" style="color: var(--primary)">Crear usuario</h4>
          </div>
          <div class="card-body">
            <div v-if="error" class="alert alert-danger">{{ error }}</div>
            <div v-if="exito" class="alert alert-success">{{ exito }}</div>

            <form @submit.prevent="registrar">
              <div class="mb-3">
                <label class="form-label">Nombre completo</label>
                <input
                  v-model="form.nombre"
                  type="text"
                  class="form-control"
                  required
                />
              </div>

              <div class="mb-3">
                <label class="form-label">Correo electronico</label>
                <input
                  v-model="form.correo"
                  type="email"
                  class="form-control"
                  required
                />
              </div>

              <div class="mb-3">
                <label class="form-label">Rol</label>
                <select v-model="form.rol" class="form-select" required>
                  <option value="cliente">Cliente</option>
                  <option value="cobrador">Cobrador</option>
                </select>
              </div>

              <div class="mb-3">
                <label class="form-label">Contrasena</label>
                <input
                  v-model="form.password"
                  type="password"
                  class="form-control"
                  required
                />
              </div>

              <div class="mb-4">
                <label class="form-label">Confirmar contrasena</label>
                <input
                  v-model="form.confirmar"
                  type="password"
                  class="form-control"
                  required
                />
              </div>

              <div class="d-flex justify-content-end gap-2">
                <button type="button" class="btn btn-outline-secondary" @click="router.push({ name: 'dashboard-admin' })">
                  Cancelar
                </button>
                <button class="btn btn-custom" :disabled="cargando">
                  <span v-if="cargando" class="spinner-border spinner-border-sm me-2"></span>
                  {{ cargando ? 'Creando...' : 'Crear usuario' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
