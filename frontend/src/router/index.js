import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'

const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/login', name: 'login', component: LoginView },
  { path: '/register', name: 'register', component: RegisterView },

  { path: '/completar-perfil', name: 'completar-perfil', component: () => import('../views/CompletarPerfilView.vue'), meta: { requiresAuth: true } },

  // Dashboards
  { path: '/dashboard-admin', name: 'dashboard-admin', component: () => import('../views/AdminDashboard.vue'), meta: { requiresAuth: true, rol: 'admin' } },
  { path: '/dashboard-usuario', name: 'dashboard-usuario', component: () => import('../views/UsuarioDashboard.vue'), meta: { requiresAuth: true } },

  // Perfil
  { path: '/perfil', name: 'perfil', component: () => import('../views/PerfilView.vue'), meta: { requiresAuth: true } },

  // Listas / visualización (admin)
  { path: '/lista-clientes', name: 'lista-clientes', component: () => import('../views/ListaClientesView.vue'), meta: { requiresAuth: true, rol: 'admin' } },
  { path: '/lista-cobradores', name: 'lista-cobradores', component: () => import('../views/ListaCobradoresView.vue'), meta: { requiresAuth: true, rol: 'admin' } },
  { path: '/lista-servicios', name: 'lista-servicios', component: () => import('../views/ListaServiciosView.vue'), meta: { requiresAuth: true, rol: 'admin' } },
  { path: '/lista-contratos', name: 'lista-contratos', component: () => import('../views/ListaContratosView.vue'), meta: { requiresAuth: true, rol: 'admin' } },
  { path: '/lista-pagos', name: 'lista-pagos', component: () => import('../views/ListaPagosView.vue'), meta: { requiresAuth: true, rol: 'admin' } },
  { path: '/validacion-cobros', name: 'validacion-cobros', component: () => import('../views/ValidacionCobrosView.vue'), meta: { requiresAuth: true, rol: 'admin' } },
  { path: '/modulo-pagos', name: 'modulo-pagos', component: () => import('../views/ModuloPagosView.vue'), meta: { requiresAuth: true, rol: 'admin' } },

  // Altas (admin)
  { path: '/alta-cliente', name: 'alta-cliente', component: () => import('../views/AltaClienteView.vue'), meta: { requiresAuth: true, rol: 'admin' } },
  { path: '/alta-paquete', name: 'alta-paquete', component: () => import('../views/AltaPaqueteView.vue'), meta: { requiresAuth: true, rol: 'admin' } },
  { path: '/alta-cobrador', name: 'alta-cobrador', component: () => import('../views/AltaCobradorView.vue'), meta: { requiresAuth: true, rol: 'admin' } },
  { path: '/alta-contrato', name: 'alta-contrato', component: () => import('../views/AltaContratoView.vue'), meta: { requiresAuth: true, rol: 'admin' } },
  { path: '/captura-pago', name: 'captura-pago', component: () => import('../views/CapturaPagoView.vue'), meta: { requiresAuth: true, rol: 'admin' } },

  // Edits (admin)
  { path: '/editar-cliente/:id', name: 'editar-cliente', component: () => import('../views/EditarClienteView.vue'), meta: { requiresAuth: true, rol: 'admin' } },
  { path: '/editar-cobrador/:id', name: 'editar-cobrador', component: () => import('../views/EditarCobradorView.vue'), meta: { requiresAuth: true, rol: 'admin' } },

  // Bajas lógicas (admin)
  { path: '/baja-cliente', name: 'baja-cliente', component: () => import('../views/BajaClienteView.vue'), meta: { requiresAuth: true, rol: 'admin' } },
  { path: '/baja-cobrador', name: 'baja-cobrador', component: () => import('../views/BajaCobradorView.vue'), meta: { requiresAuth: true, rol: 'admin' } },
  { path: '/baja-contrato', name: 'baja-contrato', component: () => import('../views/BajaContratoView.vue'), meta: { requiresAuth: true, rol: 'admin' } },
  { path: '/baja-servicio', name: 'baja-servicio', component: () => import('../views/BajaServicioView.vue'), meta: { requiresAuth: true, rol: 'admin' } },

  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to) => {
  const token = localStorage.getItem('token')
  const usuario = JSON.parse(localStorage.getItem('usuario') || 'null')

  if (to.meta.requiresAuth && !token) return { name: 'login' }

  if (to.meta.rol === 'admin' && usuario?.rol !== 'admin') {
    return token ? { name: 'dashboard-usuario' } : { name: 'login' }
  }

  if (
    token &&
    usuario?.rol !== 'admin' &&
    !usuario?.perfilCompleto &&
    to.name !== 'completar-perfil' &&
    to.name !== 'login' &&
    to.name !== 'home'
  ) {
    return { name: 'completar-perfil' }
  }
})

export default router