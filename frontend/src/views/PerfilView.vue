<script setup>
import { computed, reactive, ref } from 'vue'
import { useAuth } from '@/composables/useAuth'
import api from '@/services/api'

const { usuario, token, login, logout } = useAuth()

const form = reactive({
  nombre: usuario.value?.nombre || '',
  correo: usuario.value?.email || '',
  passwordActual: '',
  passwordNuevo: '',
  confirmar: '',
})

const exito = ref('')
const error = ref('')
const guardando = ref(false)

const nombreVisible = computed(() => {
  const nombre = [usuario.value?.nombre, usuario.value?.apaterno, usuario.value?.amaterno].filter(Boolean).join(' ').trim()
  if (nombre) return nombre
  if (usuario.value?.email) return usuario.value.email.split('@')[0]
  return usuario.value?.rol === 'admin' ? 'Administrador' : 'Usuario'
})

async function guardar() {
  exito.value = ''
  error.value = ''

  if (!form.nombre.trim()) {
    error.value = 'El nombre es obligatorio.'
    return
  }

  if (!form.correo.trim()) {
    error.value = 'El correo es obligatorio.'
    return
  }

  if (form.passwordNuevo && form.passwordNuevo !== form.confirmar) {
    error.value = 'Las contrasenas nuevas no coinciden.'
    return
  }

  guardando.value = true
  try {
    const { data } = await api.put('/usuarios/perfil', {
      nombre: form.nombre.trim(),
      email: form.correo.trim(),
      passwordActual: form.passwordActual,
      passwordNuevo: form.passwordNuevo,
    })

    login(data.usuario, token.value)
    form.nombre = data.usuario.nombre ?? form.nombre
    form.correo = data.usuario.email ?? form.correo
    exito.value = 'Perfil actualizado correctamente.'
    form.passwordActual = ''
    form.passwordNuevo = ''
    form.confirmar = ''
  } catch (err) {
    error.value = err.response?.data?.message || 'Error al actualizar el perfil.'
  } finally {
    guardando.value = false
  }
}
</script>

<template>
  <div class="container py-4">
    <div class="row justify-content-center">
      <div class="col-lg-7">

        <div class="perfil-header shadow-sm mb-4">
          <div class="perfil-avatar">
            {{ (nombreVisible[0] || 'U').toUpperCase() }}
          </div>
          <div>
            <h4 class="mb-0 fw-bold">{{ nombreVisible }}</h4>
            <span class="badge badge-rol">{{ usuario?.rol || 'sin rol' }}</span>
          </div>
        </div>

        <div class="card shadow-sm">
          <div class="card-header bg-white">
            <h5 class="mb-0 fw-bold" style="color:var(--primary)">Editar perfil</h5>
          </div>
          <div class="card-body">
            <div v-if="exito" class="alert alert-success">{{ exito }}</div>
            <div v-if="error" class="alert alert-danger">{{ error }}</div>

            <form @submit.prevent="guardar" novalidate>
              <div class="mb-3">
                <label class="form-label fw-semibold">Nombre</label>
                <input v-model="form.nombre" type="text" class="form-control" />
              </div>
              <div class="mb-3">
                <label class="form-label fw-semibold">Correo electronico</label>
                <input v-model="form.correo" type="email" class="form-control" />
              </div>

              <hr class="my-4" />
              <p class="text-muted small mb-3">Dejalo en blanco si no deseas cambiar la contrasena.</p>

              <div class="mb-3">
                <label class="form-label fw-semibold">Contrasena actual</label>
                <input v-model="form.passwordActual" type="password" class="form-control" placeholder="********" />
              </div>
              <div class="mb-3">
                <label class="form-label fw-semibold">Nueva contrasena</label>
                <input v-model="form.passwordNuevo" type="password" class="form-control" placeholder="********" />
              </div>
              <div class="mb-4">
                <label class="form-label fw-semibold">Confirmar nueva contrasena</label>
                <input v-model="form.confirmar" type="password" class="form-control" placeholder="********" />
              </div>

              <div class="d-flex justify-content-between">
                <button type="button" class="btn btn-outline-danger" @click="logout">
                  Cerrar sesion
                </button>
                <button type="submit" class="btn btn-custom" :disabled="guardando">
                  <span v-if="guardando" class="spinner-border spinner-border-sm me-1"></span>
                  {{ guardando ? 'Guardando...' : 'Guardar cambios' }}
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<style scoped>
.perfil-header {
  background: #fff;
  border-radius: 16px;
  padding: 24px 28px;
  display: flex;
  align-items: center;
  gap: 20px;
}
.perfil-avatar {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--primary);
  color: #fff;
  font-size: 1.8rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.badge-rol {
  background: var(--secondary);
  font-size: 0.78rem;
  padding: 4px 10px;
  border-radius: 20px;
  text-transform: capitalize;
}
</style>
