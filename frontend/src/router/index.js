import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'

const routes = [
  // Publicas
  { path: '/', name: 'home', component: HomeView },
  { path: '/login', name: 'login', component: LoginView },
  { path: '/register', name: 'register', component: RegisterView },

  // Completar perfil (primer inicio de sesion)
  {
    path: '/completar-perfil',
    name: 'completar-perfil',
    component: () => import('../views/CompletarPerfilView.vue'),
    meta: { requiresAuth: true },
  },

  // Dashboards por rol
  {
    path: '/dashboard-admin',
    name: 'dashboard-admin',
    component: () => import('../views/AdminDashboard.vue'),
    meta: { requiresAuth: true, rol: 'admin' },
  },
  {
    path: '/dashboard-usuario',
    name: 'dashboard-usuario',
    component: () => import('../views/UsuarioDashboard.vue'),
    meta: { requiresAuth: true },
  },

  // Perfil
  { path: '/perfil', name: 'perfil', component: () => import('../views/PerfilView.vue'), meta: { requiresAuth: true } },

  // Altas (admin)
  { path: '/alta-cliente', name: 'alta-cliente', component: () => import('../views/AltaClienteView.vue'), meta: { requiresAuth: true, rol: 'admin' } },
  { path: '/alta-paquete', name: 'alta-paquete', component: () => import('../views/AltaPaqueteView.vue'), meta: { requiresAuth: true, rol: 'admin' } },

  // Bajas logicas (admin)
  { path: '/baja-cliente', name: 'baja-cliente', component: () => import('../views/BajaClienteView.vue'), meta: { requiresAuth: true, rol: 'admin' } },
  { path: '/baja-cobrador', name: 'baja-cobrador', component: () => import('../views/BajaCobradorView.vue'), meta: { requiresAuth: true, rol: 'admin' } },
  { path: '/baja-contrato', name: 'baja-contrato', component: () => import('../views/BajaContratoView.vue'), meta: { requiresAuth: true, rol: 'admin' } },
  { path: '/baja-servicio', name: 'baja-servicio', component: () => import('../views/BajaServicioView.vue'), meta: { requiresAuth: true, rol: 'admin' } },

  // 404
  { path: '/:pathMatch(.*)*', redirect: '/' },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Navigation guard
router.beforeEach((to) => {
  const token = localStorage.getItem('token')
  const usuario = JSON.parse(localStorage.getItem('usuario') || 'null')

  if (to.meta.requiresAuth && !token) {
    return { name: 'login' }
  }

  if (to.meta.rol === 'admin' && usuario?.rol !== 'admin') {
    return token ? { name: 'dashboard-usuario' } : { name: 'login' }
  }

  // Si el usuario no es admin y no ha completado su perfil, redirige a completar perfil
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