<script setup>
import { useAuth } from '@/composables/useAuth'

const { usuario } = useAuth()
</script>

<template>
  <div class="container py-4">
    <div class="mb-4">
      <h2 class="fw-bold" style="color: var(--primary)">Bienvenido, {{ usuario?.nombre }}</h2>
      <p class="text-muted">Aquí aparecerán los servicios disponibles una vez que sean registrados.</p>
    </div>

    <div class="sin-servicios">
      <span class="sin-servicios__icono">⚱️</span>
      <h5 class="fw-bold mt-3">Sin servicios disponibles por el momento</h5>
      <p class="text-muted">Cuando el administrador registre servicios aparecerán aquí para que puedas contratarlos.</p>
    </div>
  </div>
</template>

<style scoped>
.sin-servicios {
  background: #fff;
  border-radius: 16px;
  padding: 60px 20px;
  text-align: center;
  box-shadow: 0 2px 12px rgba(47,65,86,0.08);
}
.sin-servicios__icono { font-size: 3rem; }
</style>