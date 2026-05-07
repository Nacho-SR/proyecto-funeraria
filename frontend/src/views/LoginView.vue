<script setup>
import { reactive } from 'vue'

const form = reactive({
  correo: '',
  password: '',
})

function iniciarSesion() {
  console.log(form)
  alert('Inicio de sesión exitoso')
}
</script>

<template>
  <div class="login-page">
    <div class="login-card shadow-lg">
      <h2 class="text-center mb-4 title-login">
        Iniciar Sesión
      </h2>

      <form @submit.prevent="iniciarSesion">
        <div class="mb-3">
          <label class="form-label">Correo electrónico</label>

          <input
            v-model="form.correo"
            type="email"
            class="form-control"
            placeholder="ejemplo@correo.com"
          />
        </div>

        <div class="mb-4">
          <label class="form-label">Contraseña</label>

          <input
            v-model="form.password"
            type="password"
            class="form-control"
            placeholder="********"
          />
        </div>

        <button class="btn btn-custom w-100">
          Entrar
        </button>
      </form>
    </div>
  </div>
</template>