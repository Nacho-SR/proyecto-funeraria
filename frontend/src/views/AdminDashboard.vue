<script setup>
import { useAuth } from '@/composables/useAuth'
const { usuario } = useAuth()

const tarjetas = [
  { titulo: 'Clientes', icono: '👥', ruta: '/lista-clientes', desc: 'Ver y gestionar clientes', color: '#2F4156' },
  { titulo: 'Cobradores', icono: '💼', ruta: '/lista-cobradores', desc: 'Administrar cobradores', color: '#567C8D' },
  { titulo: 'Contratos', icono: '📄', ruta: '/lista-contratos', desc: 'Gestionar contratos', color: '#2F4156' },
  { titulo: 'Servicios', icono: '⚙️', ruta: '/lista-servicios', desc: 'Ver servicios y paquetes', color: '#567C8D' },
  { titulo: 'Pagos', icono: '💰', ruta: '/lista-pagos', desc: 'Visualizar pagos', color: '#2F4156' },
  { titulo: 'Alta Cliente', icono: '➕', ruta: '/alta-cliente', desc: 'Registrar nuevo cliente', color: '#567C8D' },
  { titulo: 'Alta Cobrador', icono: '🧑‍💼', ruta: '/alta-cobrador', desc: 'Registrar nuevo cobrador', color: '#2F4156' },
  { titulo: 'Alta Paquete', icono: '📦', ruta: '/alta-paquete', desc: 'Registrar nuevo paquete', color: '#567C8D' },
  { titulo: 'Alta Contrato', icono: '📝', ruta: '/alta-contrato', desc: 'Registrar nuevo contrato', color: '#2F4156' },
  { titulo: 'Dashboard', icono: '📊', ruta: '/dashboard', desc: 'Resumen general del sistema', color: '#567C8D' },
  { titulo: 'Módulo de pagos', icono: '💳', ruta: '/modulo-pagos', desc: 'Gestión integral de pagos', color: '#2F4156' },
  { titulo: 'Captura de pago', icono: '🧾', ruta: '/captura-pago', desc: 'Registrar nuevo pago', color: '#567C8D' },
  { titulo: 'Validación de cobros', icono: '✅', ruta: '/validacion-cobros', desc: 'Aprobar o rechazar pagos', color: '#2F4156' },
]
</script>

<template>
  <div class="container py-4">
    <div class="mb-4">
      <h2 class="fw-bold" style="color: var(--primary)">Panel de administración</h2>
      <p class="text-muted">Bienvenido, <strong>{{ usuario?.nombre || 'Administrador' }}</strong></p>
    </div>

    <div class="row g-4">
      <div v-for="t in tarjetas" :key="t.titulo" class="col-sm-6 col-lg-4">
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
  background: #fff; border-radius: 14px; padding: 20px;
  display: flex; align-items: center; gap: 16px;
  transition: transform 0.2s, box-shadow 0.2s; cursor: pointer;
}
.dash-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(47,65,86,0.15) !important; }
.dash-card__icono {
  width: 52px; height: 52px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.5rem; flex-shrink: 0;
}
</style>