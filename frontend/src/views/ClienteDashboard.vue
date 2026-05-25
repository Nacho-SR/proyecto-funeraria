<script setup>
import { useAuth } from '@/composables/useAuth'

const { usuario } = useAuth()

const secciones = [
  { titulo: 'Mis contratos', texto: 'Consulta tus contratos activos y su informacion principal.' },
  { titulo: 'Pagos', texto: 'Revisa tus pagos registrados y el saldo abonado.' },
  { titulo: 'Beneficiarios', texto: 'Consulta los beneficiarios asociados a tus contratos.' },
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
        <div class="dash-card shadow-sm">
          <h6 class="fw-bold mb-2">{{ seccion.titulo }}</h6>
          <p class="text-muted small mb-0">{{ seccion.texto }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dash-card {
  background: #fff;
  border-radius: 8px;
  padding: 22px;
  min-height: 130px;
  border-left: 4px solid var(--secondary);
  box-shadow: 0 2px 12px rgba(47,65,86,0.08);
}
</style>
