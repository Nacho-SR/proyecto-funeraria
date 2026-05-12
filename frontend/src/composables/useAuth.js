import { ref, computed } from 'vue'

// Estado global reactivo (singleton fuera del composable)
const usuario = ref(JSON.parse(localStorage.getItem('usuario') || 'null'))
const token = ref(localStorage.getItem('token') || null)

export function useAuth() {
  const isAutenticado = computed(() => !!token.value)

  const rol = computed(() => usuario.value?.rol || null)
  const esAdmin = computed(() => rol.value === 'admin')
  const esUsuario = computed(() => rol.value === 'usuario' || rol.value === 'cobrador')

  function login(datosUsuario, tokenJWT) {
    usuario.value = datosUsuario
    token.value = tokenJWT
    localStorage.setItem('usuario', JSON.stringify(datosUsuario))
    localStorage.setItem('token', tokenJWT)
  }

  function logout() {
    usuario.value = null
    token.value = null
    localStorage.removeItem('usuario')
    localStorage.removeItem('token')
  }

  return {
    usuario,
    token,
    isAutenticado,
    rol,
    esAdmin,
    esUsuario,
    login,
    logout,
  }
}
