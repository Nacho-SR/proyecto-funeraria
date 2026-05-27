<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const { usuario, isAutenticado, esAdmin, esCobrador, esCliente, logout } = useAuth()
const router = useRouter()

const menuAbierto = ref(false)
const perfilAbierto = ref(false)

function toggleMenu() {
  menuAbierto.value = !menuAbierto.value
  perfilAbierto.value = false
}

function togglePerfil() {
  perfilAbierto.value = !perfilAbierto.value
  menuAbierto.value = false
}

function cerrarTodo() {
  menuAbierto.value = false
  perfilAbierto.value = false
}

function cerrarSesion() {
  logout()
  router.push('/login')
  cerrarTodo()
}

function clickFuera(e) {
  if (!e.target.closest('.navbar-perfil') && !e.target.closest('.navbar-collapse')) {
    cerrarTodo()
  }
}

onMounted(() => document.addEventListener('click', clickFuera))
onUnmounted(() => document.removeEventListener('click', clickFuera))
</script>

<template>
  <nav class="navbar navbar-expand-lg navbar-custom shadow-sm">
    <div class="container">
      <router-link class="navbar-brand fw-bold text-white" to="/" @click="cerrarTodo">
        Funeraria
      </router-link>

      <button class="navbar-toggler" type="button" @click="toggleMenu">
        <span class="navbar-toggler-icon"></span>
      </button>

      <div class="navbar-collapse" :class="{ show: menuAbierto }" id="navbarNav">
        <ul class="navbar-nav me-auto">
          <li class="nav-item">
            <router-link class="nav-link text-white" to="/" @click="cerrarTodo">Inicio</router-link>
          </li>

          <template v-if="isAutenticado && esAdmin">
            <li class="nav-item">
              <router-link class="nav-link text-white" to="/dashboard-admin" @click="cerrarTodo">Panel admin</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link text-white" to="/dashboard" @click="cerrarTodo">Resumen</router-link>
            </li>
            <li class="nav-item dropdown-parent">
              <span class="nav-link text-white nav-dropdown-toggle">Gestion</span>
              <ul class="nav-dropdown-menu">
                <li><router-link to="/lista-clientes" @click="cerrarTodo">Clientes</router-link></li>
                <li><router-link to="/lista-cobradores" @click="cerrarTodo">Cobradores</router-link></li>
                <li><router-link to="/lista-contratos" @click="cerrarTodo">Contratos</router-link></li>
                <li><router-link to="/lista-servicios" @click="cerrarTodo">Servicios</router-link></li>
              </ul>
            </li>
            <li class="nav-item dropdown-parent">
              <span class="nav-link text-white nav-dropdown-toggle">Altas</span>
              <ul class="nav-dropdown-menu">
                <li><router-link to="/register" @click="cerrarTodo">Crear usuario</router-link></li>
                <li><router-link to="/alta-cliente" @click="cerrarTodo">Alta cliente</router-link></li>
                <li><router-link to="/alta-cobrador" @click="cerrarTodo">Alta cobrador</router-link></li>
                <li><router-link to="/alta-contrato" @click="cerrarTodo">Alta contrato</router-link></li>
                <li><router-link to="/alta-paquete" @click="cerrarTodo">Alta paquete</router-link></li>
              </ul>
            </li>
            <li class="nav-item dropdown-parent">
              <span class="nav-link text-white nav-dropdown-toggle">Pagos</span>
              <ul class="nav-dropdown-menu">
                <li><router-link to="/modulo-pagos" @click="cerrarTodo">Modulo de pagos</router-link></li>
                <li><router-link to="/captura-pago" @click="cerrarTodo">Captura de pago</router-link></li>
                <li><router-link to="/validacion-cobros" @click="cerrarTodo">Validacion de cobros</router-link></li>
                <li><router-link to="/lista-pagos" @click="cerrarTodo">Lista de pagos</router-link></li>
              </ul>
            </li>
            <li class="nav-item dropdown-parent">
              <span class="nav-link text-white nav-dropdown-toggle">Rutas</span>
              <ul class="nav-dropdown-menu">
                <li><router-link to="/asignar-ruta-cobro" @click="cerrarTodo">Nueva ruta de cobro</router-link></li>
              </ul>
            </li>
          </template>

          <template v-else-if="isAutenticado && esCobrador">
            <li class="nav-item">
              <router-link class="nav-link text-white" to="/dashboard-cobrador" @click="cerrarTodo">Panel cobrador</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link text-white" to="/rutas-cobro" @click="cerrarTodo">Rutas de cobro</router-link>
            </li>
          </template>

          <template v-else-if="isAutenticado && esCliente">
            <li class="nav-item">
              <router-link class="nav-link text-white" to="/dashboard-cliente" @click="cerrarTodo">Panel cliente</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link text-white" to="/mis-contratos" @click="cerrarTodo">Mis contratos</router-link>
            </li>
            <li class="nav-item">
              <router-link class="nav-link text-white" to="/mis-pagos" @click="cerrarTodo">Mis pagos</router-link>
            </li>
          </template>
        </ul>

        <ul class="navbar-nav ms-auto align-items-center">
          <template v-if="!isAutenticado">
            <li class="nav-item">
              <router-link class="nav-link text-white" to="/login" @click="cerrarTodo">Iniciar sesion</router-link>
            </li>
          </template>

          <li v-else class="nav-item navbar-perfil position-relative">
            <button class="btn-tres-puntos" @click.stop="togglePerfil" title="Opciones de usuario">
              <div class="avatar-mini">{{ (usuario?.nombre?.[0] || 'U').toUpperCase() }}</div>
              <span class="tres-puntos">&#8942;</span>
            </button>

            <div v-if="perfilAbierto" class="perfil-dropdown shadow">
              <div class="perfil-dropdown__header">
                <div class="perfil-dropdown__avatar">{{ (usuario?.nombre?.[0] || 'U').toUpperCase() }}</div>
                <div>
                  <p class="fw-bold mb-0 text-dark">{{ usuario?.nombre || 'Usuario' }}</p>
                  <small class="text-muted">{{ usuario?.email }}</small><br/>
                  <span class="badge-rol-small">{{ usuario?.rol }}</span>
                </div>
              </div>
              <hr class="my-2"/>
              <router-link to="/perfil" class="perfil-dropdown__item" @click="cerrarTodo">Editar perfil</router-link>
              <button class="perfil-dropdown__item perfil-dropdown__item--danger" @click="cerrarSesion">Cerrar sesion</button>
            </div>
          </li>
        </ul>
      </div>
    </div>
  </nav>
</template>

<style scoped>
.navbar-custom {
  background: rgba(47, 65, 86, 0.97);
  backdrop-filter: blur(8px);
  padding: 10px 0;
  position: sticky;
  top: 0;
  z-index: 1000;
}
.navbar-brand { font-size: 1.3rem; letter-spacing: 1px; }
.nav-link { margin-left: 4px; padding: 8px 12px !important; border-radius: 8px; transition: background 0.2s; }
.nav-link:hover, .router-link-active.nav-link { background: rgba(255,255,255,0.12); }

.dropdown-parent { position: relative; }
.dropdown-parent:hover .nav-dropdown-menu { display: block; }
.nav-dropdown-toggle { cursor: pointer; user-select: none; }
.nav-dropdown-menu {
  display: none;
  position: absolute;
  top: 100%;
  left: 0;
  background: #fff;
  border-radius: 8px;
  padding: 8px 0;
  min-width: 190px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.15);
  z-index: 200;
}
.nav-dropdown-menu li { list-style: none; }
.nav-dropdown-menu a { display: block; padding: 8px 18px; color: var(--primary); text-decoration: none; font-size: 0.9rem; transition: background 0.15s; }
.nav-dropdown-menu a:hover { background: var(--soft); }

.btn-tres-puntos {
  display: flex; align-items: center; gap: 6px;
  background: rgba(255,255,255,0.12); border: none;
  border-radius: 20px; padding: 6px 10px;
  cursor: pointer; color: #fff; transition: background 0.2s;
}
.btn-tres-puntos:hover { background: rgba(255,255,255,0.22); }
.avatar-mini {
  width: 28px; height: 28px; border-radius: 50%;
  background: var(--secondary);
  display: flex; align-items: center; justify-content: center;
  font-size: 0.85rem; font-weight: 700; color: #fff;
}
.tres-puntos { font-size: 1.4rem; line-height: 1; }

.perfil-dropdown {
  position: absolute; right: 0; top: calc(100% + 10px);
  background: #fff; border-radius: 8px; padding: 16px;
  min-width: 230px; z-index: 300;
}
.perfil-dropdown__header { display: flex; gap: 12px; align-items: center; }
.perfil-dropdown__avatar {
  width: 44px; height: 44px; border-radius: 50%;
  background: var(--primary); color: #fff;
  display: flex; align-items: center; justify-content: center;
  font-size: 1.2rem; font-weight: 700; flex-shrink: 0;
}
.badge-rol-small { background: var(--secondary); color: #fff; border-radius: 20px; padding: 2px 8px; font-size: 0.7rem; text-transform: capitalize; }
.perfil-dropdown__item {
  display: flex; align-items: center; gap: 8px;
  padding: 9px 10px; border-radius: 8px;
  color: var(--primary); text-decoration: none;
  font-size: 0.88rem; font-weight: 500;
  transition: background 0.15s;
  width: 100%; text-align: left; border: none; background: none; cursor: pointer;
}
.perfil-dropdown__item:hover { background: var(--soft); }
.perfil-dropdown__item--danger { color: #dc3545; }
.perfil-dropdown__item--danger:hover { background: #fff0f0; }

.navbar-collapse { display: none; flex-direction: column; width: 100%; }
@media (min-width: 992px) { .navbar-collapse { display: flex !important; flex-direction: row; width: auto; } }
.navbar-collapse.show { display: flex; }
</style>
