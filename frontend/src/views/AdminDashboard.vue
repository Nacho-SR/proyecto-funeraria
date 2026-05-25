<script setup>
import { useAuth } from '@/composables/useAuth'

const { usuario } = useAuth()

const secciones = [
  {
    titulo: 'Gestion',
    items: [
      { titulo: 'Clientes', ruta: '/lista-clientes', desc: 'Consulta y administra clientes.' },
      { titulo: 'Cobradores', ruta: '/lista-cobradores', desc: 'Consulta y administra cobradores.' },
      { titulo: 'Contratos', ruta: '/lista-contratos', desc: 'Consulta contratos activos y estado de pago.' },
      { titulo: 'Servicios', ruta: '/lista-servicios', desc: 'Consulta paquetes y servicios.' },
    ],
  },
  {
    titulo: 'Altas',
    items: [
      { titulo: 'Crear usuario', ruta: '/register', desc: 'Crea usuarios cliente o cobrador.' },
      { titulo: 'Alta cliente', ruta: '/alta-cliente', desc: 'Registra un cliente completo.' },
      { titulo: 'Alta cobrador', ruta: '/alta-cobrador', desc: 'Registra un nuevo cobrador.' },
      { titulo: 'Alta contrato', ruta: '/alta-contrato', desc: 'Crea contratos para clientes.' },
      { titulo: 'Alta paquete', ruta: '/alta-paquete', desc: 'Registra paquetes del servicio.' },
    ],
  },
  {
    titulo: 'Pagos',
    items: [
      { titulo: 'Modulo de pagos', ruta: '/modulo-pagos', desc: 'Revisa pagos y filtros generales.' },
      { titulo: 'Captura de pago', ruta: '/captura-pago', desc: 'Registra pagos validados por admin.' },
      { titulo: 'Validacion de cobros', ruta: '/validacion-cobros', desc: 'Valida pagos capturados por cobradores.' },
      { titulo: 'Dashboard general', ruta: '/dashboard', desc: 'Consulta indicadores del sistema.' },
    ],
  },
]
</script>

<template>
  <div class="container py-4">
    <div class="mb-4">
      <h2 class="fw-bold" style="color: var(--primary)">Panel de administracion</h2>
      <p class="text-muted mb-0">Bienvenido, <strong>{{ usuario?.nombre || 'Administrador' }}</strong></p>
    </div>

    <section v-for="seccion in secciones" :key="seccion.titulo" class="mb-4">
      <h5 class="section-title">{{ seccion.titulo }}</h5>
      <div class="row g-3">
        <div v-for="item in seccion.items" :key="item.ruta" class="col-sm-6 col-lg-3">
          <router-link :to="item.ruta" class="text-decoration-none">
            <div class="dash-card">
              <h6 class="fw-bold mb-2">{{ item.titulo }}</h6>
              <p class="text-muted small mb-0">{{ item.desc }}</p>
            </div>
          </router-link>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.section-title {
  color: var(--primary);
  font-weight: 700;
  margin-bottom: 12px;
}
.dash-card {
  background: #fff;
  border-radius: 8px;
  padding: 18px;
  min-height: 122px;
  border-left: 4px solid var(--secondary);
  box-shadow: 0 2px 12px rgba(47,65,86,0.08);
  transition: transform 0.2s, box-shadow 0.2s;
}
.dash-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 22px rgba(47,65,86,0.14);
}
</style>
