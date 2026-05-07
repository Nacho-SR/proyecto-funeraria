import { createRouter, createWebHistory } from 'vue-router'

import HomeView from '../views/HomeView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'

const routes = [

  {
    path: '/',
    name: 'home',
    component: HomeView,
  },

  {
    path: '/login',
    name: 'login',
    component: LoginView,
  },

  {
    path: '/register',
    name: 'register',
    component: RegisterView,
  },
  {
  path: '/alta-cliente',
  name: 'alta-cliente',
  component: () => import('../views/AltaClienteView.vue')
},
{
  path: '/alta-paquete',
  name: 'alta-paquete',
  component: () => import('../views/AltaPaqueteView.vue')
},
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

export default router