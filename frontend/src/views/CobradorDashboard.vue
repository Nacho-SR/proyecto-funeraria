<script setup>
import { useAuth } from '@/composables/useAuth'

const { usuario } = useAuth()

const acciones = [
  { titulo: 'Ruta asignada', texto: 'Consulta tus visitas y el orden de cobro del dia.', estado: 'Pendiente' },
  { titulo: 'Registrar cobro', texto: 'Captura pagos recibidos durante la ruta.', estado: 'Pendiente' },
  { titulo: 'Historial', texto: 'Revisa cobros realizados y su estado de validacion.', estado: 'Pendiente' },
]
</script>

<template>
  <div class="container py-4">
    <div class="mb-4">
      <h2 class="fw-bold" style="color: var(--primary)">Panel de cobrador</h2>
      <p class="text-muted mb-0">Bienvenido, <strong>{{ usuario?.nombre || 'Cobrador' }}</strong></p>
    </div>

    <div class="row g-4">
      <div v-for="accion in acciones" :key="accion.titulo" class="col-md-4">
        <div class="dash-card shadow-sm">
          <div class="dash-card__mark">{{ accion.titulo.slice(0, 1) }}</div>
          <div>
            <h6 class="fw-bold mb-1">{{ accion.titulo }}</h6>
            <p class="text-muted small mb-2">{{ accion.texto }}</p>
            <span class="badge bg-secondary">{{ accion.estado }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dash-card {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  min-height: 150px;
  display: flex;
  gap: 14px;
  box-shadow: 0 2px 12px rgba(47,65,86,0.08);
}
.dash-card__mark {
  width: 44px;
  height: 44px;
  border-radius: 8px;
  background: var(--secondary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  flex-shrink: 0;
}
</style>
