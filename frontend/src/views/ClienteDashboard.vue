<script setup>
import { useAuth } from '@/composables/useAuth'

const { usuario } = useAuth()

const secciones = [
  {
    titulo: 'Mis contratos',
    texto: 'Contratos activos, saldos y detalles.',
    ruta: '/mis-contratos'
  },
  {
    titulo: 'Pagos',
    texto: 'Historial y pagos registrados.',
    ruta: '/mis-contratos'
  },
  {
    titulo: 'Beneficiarios',
    texto: 'Personas asociadas a tus contratos.',
    ruta: '/mis-contratos'
  },
]
</script>

<template>
  <div class="container py-4">
    <div class="mb-4">
      <h2 class="fw-bold" style="color: var(--primary)">Panel de cliente</h2>
      <p class="text-muted mb-0">Bienvenido, <strong>{{ usuario?.nombre || 'Cliente' }}</strong></p>
    </div>

    <div class="row g-4">
      <div v-for="seccion in secciones" :key="seccion.titulo" class="col-md-4">
        <router-link :to="seccion.ruta" class="dash-card shadow-sm">
          <h6 class="fw-bold mb-2">{{ seccion.titulo }}</h6>
          <p class="text-muted small mb-0">{{ seccion.texto }}</p>
        </router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dash-card {
  display: block;
  background: #fff;
  border-radius: 8px;
  padding: 22px;
  min-height: 130px;
  border-left: 4px solid var(--secondary);
  box-shadow: 0 2px 12px rgba(47,65,86,0.08);
  text-decoration: none;
  color: inherit;
  transition: transform 0.18s, box-shadow 0.18s;
}

.dash-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 22px rgba(47,65,86,0.12);
}
</style>
