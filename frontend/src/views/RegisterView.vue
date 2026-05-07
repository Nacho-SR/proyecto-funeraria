<script setup>
import { reactive } from 'vue'

const form = reactive({
  nombre: '',
  correo: '',
  password: '',
  confirmar: '',
})

function registrar() {

  if (form.password !== form.confirmar) {
    alert('Las contraseñas no coinciden')
    return
  }

  alert('Registro exitoso')
}
</script>

<template>

  <div class="login-page">

    <div class="login-card shadow-lg">

      <h2 class="text-center mb-4 title-login">
        Crear Cuenta
      </h2>

      <form @submit.prevent="registrar">

        <div class="mb-3">

          <label class="form-label">
            Nombre completo
          </label>

          <input
            v-model="form.nombre"
            type="text"
            class="form-control"
            placeholder="Ingrese su nombre"
          />

        </div>

        <div class="mb-3">

          <label class="form-label">
            Correo electrónico
          </label>

          <input
            v-model="form.correo"
            type="email"
            class="form-control"
            placeholder="ejemplo@correo.com"
          />

        </div>

        <div class="mb-3">

          <label class="form-label">
            Contraseña
          </label>

          <input
            v-model="form.password"
            type="password"
            class="form-control"
            placeholder="********"
          />

        </div>

        <div class="mb-4">

          <label class="form-label">
            Confirmar contraseña
          </label>

          <input
            v-model="form.confirmar"
            type="password"
            class="form-control"
            placeholder="********"
          />

        </div>

        <button class="btn btn-custom w-100 mb-3">
          Registrarse
        </button>

        <div class="text-center">

          <router-link
            to="/login"
            class="text-decoration-none"
          >
            ¿Ya tienes cuenta? Inicia sesión
          </router-link>

        </div>

      </form>

    </div>

  </div>

</template>