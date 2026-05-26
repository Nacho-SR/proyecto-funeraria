<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import api from '@/services/api'

const emit = defineEmits(['guardado', 'cancelado'])

const modos = [
  { value: 'paquete', label: 'Solo paquete' },
  { value: 'adicional', label: 'Solo adicional' },
  { value: 'promo_existente', label: 'Promo existente' },
  { value: 'paquete_adicional', label: 'Paquete + adicional' }
]

const modo = ref('paquete')
const productos = ref({ paquetes: [], adicionales: [], promociones: [] })
const cargando = ref(false)
const enviando = ref(false)
const mensajeExito = ref('')
const mensajeError = ref('')
const errores = ref({})

const form = reactive({
  paquete_id: '',
  adicional_id: '',
  promo: false,
  precio_especial: null,
  paquete: paqueteVacio(),
  adicional: adicionalVacio()
})

onMounted(cargarProductos)

const paquetes = computed(() => productos.value.paquetes ?? [])
const adicionales = computed(() => productos.value.adicionales ?? [])
const promociones = computed(() => productos.value.promociones ?? [])

const paqueteSeleccionado = computed(() => paquetes.value.find(paquete => idPaquete(paquete) === form.paquete_id))
const adicionalSeleccionado = computed(() => adicionales.value.find(adicional => idAdicional(adicional) === form.adicional_id))
const promoExistente = computed(() =>
  promociones.value.find(promo =>
    (promo.paquete_id ?? promo.paquetes_id) === form.paquete_id &&
    (promo.adicional_id ?? promo.adicionales_id) === form.adicional_id
  )
)

const requierePaqueteNuevo = computed(() => ['paquete', 'paquete_adicional'].includes(modo.value))
const requiereAdicionalNuevo = computed(() => ['adicional', 'paquete_adicional'].includes(modo.value))
const requierePromo = computed(() => modo.value === 'promo_existente' || (modo.value === 'paquete_adicional' && form.promo))

async function cargarProductos() {
  cargando.value = true
  mensajeError.value = ''
  try {
    const { data } = await api.get('/administrativos/productos-activos')
    productos.value = data?.productosActivos ?? { paquetes: [], adicionales: [], promociones: [] }
  } catch (err) {
    mensajeError.value = err.response?.data?.message || 'No se pudieron cargar paquetes y adicionales.'
  } finally {
    cargando.value = false
  }
}

function paqueteVacio() {
  return {
    nombre: '',
    descripcion: '',
    precio_base: null
  }
}

function adicionalVacio() {
  return {
    nombre: '',
    descripcion: '',
    precio: null
  }
}

function idPaquete(paquete) {
  return paquete.paquete_id ?? paquete.paquetes_id
}

function idAdicional(adicional) {
  return adicional.adicional_id ?? adicional.adicionales_id
}

function cambiarModo(nuevoModo) {
  modo.value = nuevoModo
  errores.value = {}
  mensajeError.value = ''
  mensajeExito.value = ''
  form.paquete_id = ''
  form.adicional_id = ''
  form.promo = nuevoModo === 'promo_existente'
  form.precio_especial = null
  form.paquete = paqueteVacio()
  form.adicional = adicionalVacio()
}

function validar() {
  const next = {}

  if (requierePaqueteNuevo.value) {
    validarTexto(next, 'paquete.nombre', form.paquete.nombre, 3, 'Nombre del paquete')
    validarTexto(next, 'paquete.descripcion', form.paquete.descripcion, 10, 'Descripcion del paquete')
    validarNumero(next, 'paquete.precio_base', form.paquete.precio_base, 'Precio base')
  }

  if (requiereAdicionalNuevo.value) {
    validarTexto(next, 'adicional.nombre', form.adicional.nombre, 3, 'Nombre del adicional')
    validarTexto(next, 'adicional.descripcion', form.adicional.descripcion, 10, 'Descripcion del adicional')
    validarNumero(next, 'adicional.precio', form.adicional.precio, 'Precio del adicional')
  }

  if (modo.value === 'promo_existente') {
    if (!form.paquete_id) next.paquete_id = 'Selecciona un paquete.'
    if (!form.adicional_id) next.adicional_id = 'Selecciona un adicional.'
    if (promoExistente.value) next.promo = 'Ya existe una promo para esta combinacion.'
  }

  if (requierePromo.value) {
    validarNumero(next, 'precio_especial', form.precio_especial, 'Precio especial')
  }

  errores.value = next
  return Object.keys(next).length === 0
}

function validarTexto(target, key, value, min, label) {
  if (!String(value ?? '').trim() || String(value ?? '').trim().length < min) {
    target[key] = `${label} debe tener al menos ${min} caracteres.`
  }
}

function validarNumero(target, key, value, label) {
  const numero = Number(value)
  if (!Number.isFinite(numero) || numero <= 0) {
    target[key] = `${label} debe ser mayor a cero.`
  }
}

function construirPayload() {
  if (modo.value === 'paquete') {
    return {
      paquete: {
        ...form.paquete,
        precio_base: Number(form.paquete.precio_base)
      }
    }
  }

  if (modo.value === 'adicional') {
    return {
      adicional: {
        ...form.adicional,
        precio: Number(form.adicional.precio)
      }
    }
  }

  if (modo.value === 'promo_existente') {
    return {
      paquete_id: form.paquete_id,
      adicional_id: form.adicional_id,
      promo: true,
      precio_especial: Number(form.precio_especial)
    }
  }

  return {
    paquete: {
      ...form.paquete,
      precio_base: Number(form.paquete.precio_base)
    },
    adicional: {
      ...form.adicional,
      precio: Number(form.adicional.precio)
    },
    promo: form.promo,
    precio_especial: form.promo ? Number(form.precio_especial) : undefined
  }
}

async function guardar() {
  mensajeExito.value = ''
  mensajeError.value = ''
  if (!validar()) return

  enviando.value = true
  try {
    const { data } = await api.post('/administrativos/alta-paquete-adicional', construirPayload())
    mensajeExito.value = mensajeExitoPorModo()
    emit('guardado', data)
    limpiar()
    await cargarProductos()
  } catch (err) {
    mensajeError.value = err.response?.data?.message || 'No se pudo guardar la informacion.'
  } finally {
    enviando.value = false
  }
}

function mensajeExitoPorModo() {
  return {
    paquete: 'Paquete registrado correctamente.',
    adicional: 'Adicional registrado correctamente.',
    promo_existente: 'Promocion registrada correctamente.',
    paquete_adicional: form.promo
      ? 'Paquete, adicional y promocion registrados correctamente.'
      : 'Paquete y adicional registrados correctamente.'
  }[modo.value]
}

function limpiar() {
  form.paquete_id = ''
  form.adicional_id = ''
  form.promo = modo.value === 'promo_existente'
  form.precio_especial = null
  form.paquete = paqueteVacio()
  form.adicional = adicionalVacio()
  errores.value = {}
}

function cancelar() {
  limpiar()
  emit('cancelado')
}

function formatoMoneda(valor) {
  return Number(valor ?? 0).toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN'
  })
}
</script>

<template>
  <div>
    <div v-if="mensajeExito" class="alert alert-success">{{ mensajeExito }}</div>
    <div v-if="mensajeError" class="alert alert-danger">{{ mensajeError }}</div>

    <div class="mode-grid mb-4">
      <button
        v-for="item in modos"
        :key="item.value"
        type="button"
        class="mode-button"
        :class="{ activo: modo === item.value }"
        @click="cambiarModo(item.value)"
      >
        {{ item.label }}
      </button>
    </div>

    <div v-if="cargando" class="text-center py-4">
      <div class="spinner-border" style="color: var(--secondary)"></div>
    </div>

    <form v-else @submit.prevent="guardar" novalidate>
      <section v-if="modo === 'promo_existente'" class="section-panel mb-4">
        <h5 class="fw-bold mb-3">Promocion con productos existentes</h5>
        <div class="row g-3">
          <div class="col-md-6">
            <label class="form-label">Paquete</label>
            <select v-model="form.paquete_id" class="form-select" :class="{ 'is-invalid': errores.paquete_id || errores.promo }">
              <option value="" disabled>Selecciona un paquete</option>
              <option v-for="paquete in paquetes" :key="idPaquete(paquete)" :value="idPaquete(paquete)">
                {{ paquete.nombre }} · {{ formatoMoneda(paquete.precio_base) }}
              </option>
            </select>
            <div class="invalid-feedback">{{ errores.paquete_id || errores.promo }}</div>
          </div>
          <div class="col-md-6">
            <label class="form-label">Adicional</label>
            <select v-model="form.adicional_id" class="form-select" :class="{ 'is-invalid': errores.adicional_id }">
              <option value="" disabled>Selecciona un adicional</option>
              <option v-for="adicional in adicionales" :key="idAdicional(adicional)" :value="idAdicional(adicional)">
                {{ adicional.nombre }} · {{ formatoMoneda(adicional.precio) }}
              </option>
            </select>
            <div class="invalid-feedback">{{ errores.adicional_id }}</div>
          </div>
          <div class="col-md-4">
            <label class="form-label">Precio especial</label>
            <input v-model.number="form.precio_especial" type="number" min="0" step="0.01" class="form-control" :class="{ 'is-invalid': errores.precio_especial }" />
            <div class="invalid-feedback">{{ errores.precio_especial }}</div>
          </div>
        </div>

        <div v-if="paqueteSeleccionado && adicionalSeleccionado" class="summary-strip mt-3">
          <span>{{ paqueteSeleccionado.nombre }}</span>
          <span>{{ adicionalSeleccionado.nombre }}</span>
          <strong>{{ formatoMoneda(form.precio_especial) }}</strong>
        </div>
      </section>

      <section v-if="requierePaqueteNuevo" class="section-panel mb-4">
        <h5 class="fw-bold mb-3">Datos del paquete</h5>
        <div class="row g-3">
          <div class="col-md-7">
            <label class="form-label">Nombre</label>
            <input v-model="form.paquete.nombre" class="form-control" :class="{ 'is-invalid': errores['paquete.nombre'] }" />
            <div class="invalid-feedback">{{ errores['paquete.nombre'] }}</div>
          </div>
          <div class="col-md-5">
            <label class="form-label">Precio base</label>
            <input v-model.number="form.paquete.precio_base" type="number" min="0" step="0.01" class="form-control" :class="{ 'is-invalid': errores['paquete.precio_base'] }" />
            <div class="invalid-feedback">{{ errores['paquete.precio_base'] }}</div>
          </div>
          <div class="col-12">
            <label class="form-label">Descripcion</label>
            <textarea v-model="form.paquete.descripcion" rows="3" class="form-control" :class="{ 'is-invalid': errores['paquete.descripcion'] }"></textarea>
            <div class="invalid-feedback">{{ errores['paquete.descripcion'] }}</div>
          </div>
        </div>
      </section>

      <section v-if="requiereAdicionalNuevo" class="section-panel mb-4">
        <h5 class="fw-bold mb-3">Datos del adicional</h5>
        <div class="row g-3">
          <div class="col-md-7">
            <label class="form-label">Nombre</label>
            <input v-model="form.adicional.nombre" class="form-control" :class="{ 'is-invalid': errores['adicional.nombre'] }" />
            <div class="invalid-feedback">{{ errores['adicional.nombre'] }}</div>
          </div>
          <div class="col-md-5">
            <label class="form-label">Precio</label>
            <input v-model.number="form.adicional.precio" type="number" min="0" step="0.01" class="form-control" :class="{ 'is-invalid': errores['adicional.precio'] }" />
            <div class="invalid-feedback">{{ errores['adicional.precio'] }}</div>
          </div>
          <div class="col-12">
            <label class="form-label">Descripcion</label>
            <textarea v-model="form.adicional.descripcion" rows="3" class="form-control" :class="{ 'is-invalid': errores['adicional.descripcion'] }"></textarea>
            <div class="invalid-feedback">{{ errores['adicional.descripcion'] }}</div>
          </div>
        </div>
      </section>

      <section v-if="modo === 'paquete_adicional'" class="section-panel mb-4">
        <div class="form-check form-switch">
          <input id="promo" v-model="form.promo" class="form-check-input" type="checkbox" />
          <label class="form-check-label fw-semibold" for="promo">Crear promocion para esta combinacion</label>
        </div>
        <div v-if="form.promo" class="row g-3 mt-1">
          <div class="col-md-4">
            <label class="form-label">Precio especial</label>
            <input v-model.number="form.precio_especial" type="number" min="0" step="0.01" class="form-control" :class="{ 'is-invalid': errores.precio_especial }" />
            <div class="invalid-feedback">{{ errores.precio_especial }}</div>
          </div>
        </div>
      </section>

      <section class="section-panel mb-4">
        <h5 class="fw-bold mb-3">Resumen</h5>
        <div class="summary-grid">
          <div>
            <span>Modo</span>
            <strong>{{ modos.find(item => item.value === modo)?.label }}</strong>
          </div>
          <div v-if="requierePaqueteNuevo">
            <span>Paquete</span>
            <strong>{{ form.paquete.nombre || 'Sin nombre' }}</strong>
          </div>
          <div v-if="requiereAdicionalNuevo">
            <span>Adicional</span>
            <strong>{{ form.adicional.nombre || 'Sin nombre' }}</strong>
          </div>
          <div v-if="requierePromo">
            <span>Precio especial</span>
            <strong>{{ formatoMoneda(form.precio_especial) }}</strong>
          </div>
        </div>
      </section>

      <div class="d-flex justify-content-end gap-2">
        <button type="button" class="btn btn-outline-secondary" @click="cancelar" :disabled="enviando">
          Cancelar
        </button>
        <button type="submit" class="btn btn-custom" :disabled="enviando">
          <span v-if="enviando" class="spinner-border spinner-border-sm me-2"></span>
          {{ enviando ? 'Guardando...' : 'Guardar' }}
        </button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.mode-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 10px;
}

.mode-button {
  border: 1px solid #d8e4eb;
  background: #fff;
  color: var(--primary);
  border-radius: 8px;
  padding: 12px;
  font-weight: 700;
}

.mode-button.activo {
  background: var(--secondary);
  border-color: var(--secondary);
  color: #fff;
}

.section-panel {
  background: #fff;
  border: 1px solid #e5edf2;
  border-radius: 8px;
  padding: 18px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
}

.summary-grid div,
.summary-strip {
  border: 1px solid #e5edf2;
  border-radius: 8px;
  padding: 12px;
}

.summary-grid span {
  display: block;
  color: #667085;
  font-size: 0.82rem;
  font-weight: 600;
}

.summary-strip {
  display: flex;
  gap: 12px;
  justify-content: space-between;
  align-items: center;
  background: #f8fafb;
}

@media (max-width: 768px) {
  .mode-grid {
    grid-template-columns: 1fr;
  }

  .summary-strip {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
