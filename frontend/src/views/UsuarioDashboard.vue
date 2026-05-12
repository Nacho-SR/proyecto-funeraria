<script setup>
import { useAuth } from '@/composables/useAuth'
const { usuario } = useAuth()

// El usuario solo ve rutas propias — formularios de servicios/paquetes
const tarjetas = [
  { titulo: 'Alta de Servicio', icono: '⚙️', ruta: '/alta-servicio', desc: 'Registrar nuevo servicio', color: '#2F4156' },
  { titulo: 'Alta de Paquete', icono: '📦', ruta: '/alta-paquete', desc: 'Registrar nuevo paquete', color: '#567C8D' },
  { titulo: 'Mis contratos', icono: '📄', ruta: '/mis-contratos', desc: 'Ver mis contratos activos', color: '#2F4156' },
]
</script>

<template>
  <div class="container py-4">
    <div class="mb-4">
      <h2 class="fw-bold" style="color: var(--primary)">Mi panel</h2>
      <p class="text-muted">Bienvenido, <strong>{{ usuario?.nombre || 'Usuario' }}</strong></p>
    </div>

    <div class="row g-4">
      <div
        v-for="t in tarjetas"
        :key="t.titulo"
        class="col-sm-6 col-lg-4"
      >
        <router-link :to="t.ruta" class="text-decoration-none">
          <div class="dash-card shadow-sm">
            <div class="dash-card__icono" :style="{ background: t.color }">{{ t.icono }}</div>
            <div>
              <h6 class="fw-bold mb-1">{{ t.titulo }}</h6>
              <p class="text-muted small mb-0">{{ t.desc }}</p>
            </div>
          </div>
        </router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dash-card {
  background: #fff;
  border-radius: 14px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: transform 0.2s, box-shadow 0.2s;
  cursor: pointer;
}
.dash-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(47,65,86,0.15) !important; }
.dash-card__icono {
  width: 52px; height: 52px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.5rem; flex-shrink: 0;
}
</style>
