import { ref, computed } from 'vue'
import api from '@/services/api'

function leerUsuarioGuardado() {
  try {
    return JSON.parse(localStorage.getItem('usuario') || 'null')
  } catch {
    localStorage.removeItem('usuario')
    return null
  }
}

const usuario = ref(leerUsuarioGuardado())
const token = ref(localStorage.getItem('token') || null)
let sesionValidada = false

export function useAuth() {
  const isAutenticado = computed(() => !!token.value)

  const rol = computed(() => usuario.value?.rol || null)
  const esAdmin = computed(() => rol.value === 'admin')
  const esCobrador = computed(() => rol.value === 'cobrador')
  const esCliente = computed(() => rol.value === 'cliente')
  const esUsuario = computed(() => esCobrador.value || esCliente.value)

  function login(datosUsuario, tokenJWT) {
    usuario.value = datosUsuario
    token.value = tokenJWT
    sesionValidada = true
    localStorage.setItem('usuario', JSON.stringify(datosUsuario))
    localStorage.setItem('token', tokenJWT)
  }

  function logout() {
    usuario.value = null
    token.value = null
    sesionValidada = false
    localStorage.removeItem('usuario')
    localStorage.removeItem('token')
  }

  async function validarSesion() {
    if (!token.value) {
      logout()
      return null
    }

    if (sesionValidada && usuario.value) {
      return usuario.value
    }

    try {
      const { data } = await api.get('/auth/me')
      usuario.value = data.usuario
      sesionValidada = true
      localStorage.setItem('usuario', JSON.stringify(data.usuario))
      return data.usuario
    } catch {
      logout()
      return null
    }
  }

  return {
    usuario,
    token,
    isAutenticado,
    rol,
    esAdmin,
    esCobrador,
    esCliente,
    esUsuario,
    login,
    logout,
    validarSesion,
  }
}
