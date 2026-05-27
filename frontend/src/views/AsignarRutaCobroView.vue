<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import { rutaCobroAdminService } from '@/services/rutaCobroAdmin.service'

const router = useRouter()

const contratos = ref([])
const cobradores = ref([])
const seleccionados = ref([])
const cargando = ref(false)
const enviando = ref(false)
const error = ref('')
const exito = ref('')

const filtros = reactive({
  calle: '',
  colonia: '',
  horario: '',
  texto: '',
  cobrador: ''
})

const form = reactive({
  nombre: '',
  fecha_inicio: '',
  periodicidad: 'semanal',
  cobradores_id: ''
})

onMounted(cargarDatos)

async function cargarDatos() {
  cargando.value = true
  error.value = ''
  try {
    const [resContratos, resCobradores] = await Promise.all([
      rutaCobroAdminService.listarContratos(),
      rutaCobroAdminService.listarCobradores()
    ])
    contratos.value = normalizarContratos(resContratos.data?.contratos ?? resContratos.data ?? [])
    cobradores.value = resCobradores.data?.cobradores ?? resCobradores.data ?? []
  } catch (err) {
    error.value = err.response?.data?.message || 'No se pudo cargar la informacion para crear la ruta.'
  } finally {
    cargando.value = false
  }
}

const contratosDisponibles = computed(() =>
  contratos.value.filter(contrato => contrato.activo !== false && contrato.estado !== 'cancelado' && saldoPendiente(contrato) > 0)
)

const contratosFiltrados = computed(() => {
  const calle = filtros.calle.trim().toLowerCase()
  const colonia = filtros.colonia.trim().toLowerCase()
  const horario = filtros.horario.trim().toLowerCase()
  const texto = filtros.texto.trim().toLowerCase()

  return contratosDisponibles.value.filter(contrato => {
    const direccion = contrato.direccion_cobro ?? {}
    const titular = nombreCliente(contrato).toLowerCase()
    const numContrato = String(contrato.num_contrato ?? contrato.contratos_id ?? '').toLowerCase()

    return (
      (!calle || String(direccion.calle ?? '').toLowerCase().includes(calle)) &&
      (!colonia || String(direccion.colonia ?? '').toLowerCase().includes(colonia)) &&
      (!horario || String(direccion.horario_atencion ?? '').toLowerCase().includes(horario)) &&
      (!texto || titular.includes(texto) || numContrato.includes(texto))
    )
  })
})

const cobradoresFiltrados = computed(() => {
  const q = filtros.cobrador.trim().toLowerCase()
  if (!q) return cobradores.value
  return cobradores.value.filter(item => nombreCobrador(item).toLowerCase().includes(q))
})

const contratosSeleccionados = computed(() =>
  seleccionados.value
    .map(id => contratos.value.find(contrato => contrato.contratos_id === id))
    .filter(Boolean)
)

const puedeGuardar = computed(() =>
  form.nombre.trim().length >= 3 &&
  form.fecha_inicio &&
  form.cobradores_id &&
  contratosSeleccionados.value.length > 0 &&
  !enviando.value
)

function normalizarContratos(lista) {
  return lista
    .map(contrato => ({
      ...contrato,
      contratos_id: contrato.contratos_id ?? contrato.contratoID ?? contrato.id,
      direccion_cobro: contrato.direccion_cobro ?? contrato.direccionCobro ?? null
    }))
    .filter(contrato => contrato.contratos_id && contrato.direccion_cobro?.direcciones_cobro_id)
}

function estaSeleccionado(contratoId) {
  return seleccionados.value.includes(contratoId)
}

function alternarContrato(contrato) {
  const id = contrato.contratos_id
  if (estaSeleccionado(id)) {
    seleccionados.value = seleccionados.value.filter(item => item !== id)
  } else {
    seleccionados.value = [...seleccionados.value, id]
  }
}

function moverContrato(index, direccion) {
  const nuevoIndex = index + direccion
  if (nuevoIndex < 0 || nuevoIndex >= seleccionados.value.length) return

  const copia = [...seleccionados.value]
  const [item] = copia.splice(index, 1)
  copia.splice(nuevoIndex, 0, item)
  seleccionados.value = copia
}

function quitarContrato(contratoId) {
  seleccionados.value = seleccionados.value.filter(item => item !== contratoId)
}

function limpiarFiltros() {
  filtros.calle = ''
  filtros.colonia = ''
  filtros.horario = ''
  filtros.texto = ''
}

async function guardarRuta() {
  error.value = ''
  exito.value = ''

  if (!puedeGuardar.value) {
    error.value = 'Completa los datos de la ruta y selecciona al menos un contrato.'
    return
  }

  const detalles = contratosSeleccionados.value.map((contrato, index) => ({
    contratos_id: contrato.contratos_id,
    direccion_cobro_id: contrato.direccion_cobro.direcciones_cobro_id,
    orden_visita: index + 1
  }))

  enviando.value = true
  try {
    await rutaCobroAdminService.crear({
      cobradores_id: form.cobradores_id,
      nombre: form.nombre.trim(),
      fecha_inicio: form.fecha_inicio,
      periodicidad: form.periodicidad,
      detalles
    })
    exito.value = 'Ruta de cobro creada correctamente.'
    limpiarFormulario()
  } catch (err) {
    error.value = err.response?.data?.message || 'No se pudo crear la ruta de cobro.'
  } finally {
    enviando.value = false
  }
}

function limpiarFormulario() {
  form.nombre = ''
  form.fecha_inicio = ''
  form.periodicidad = 'semanal'
  form.cobradores_id = ''
  filtros.cobrador = ''
  seleccionados.value = []
}

function cancelar() {
  router.back()
}

function nombreCliente(contrato) {
  const usuario = contrato.cliente?.usuario
  if (!usuario) return 'Cliente sin nombre'
  return [usuario.nombre, usuario.apaterno, usuario.amaterno].filter(Boolean).join(' ')
}

function nombreCobrador(item) {
  const usuario = item?.usuario
  if (!usuario) return 'Cobrador sin nombre'
  return [usuario.nombre, usuario.apaterno, usuario.amaterno].filter(Boolean).join(' ')
}

function formatoDireccion(direccion) {
  if (!direccion) return 'Sin direccion de cobro'
  return [direccion.calle, direccion.num_casa, direccion.colonia].filter(Boolean).join(', ')
}

function saldoPendiente(contrato) {
  return Math.max(Number(contrato.precio_final ?? 0) - Number(contrato.abonado ?? 0), 0)
}

function formatoMoneda(valor) {
  return Number(valor ?? 0).toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN'
  })
}
</script>

<template>
  <div class="container py-4">
    <div class="d-flex justify-content-between align-items-start gap-3 flex-wrap mb-4">
      <div>
        <h3 class="mb-1 fw-bold" style="color: var(--primary)">Nueva ruta de cobro</h3>
        <small class="text-muted">Selecciona contratos con saldo pendiente, asigna cobrador y define el orden de visita.</small>
      </div>
      <button class="btn btn-outline-secondary" @click="cargarDatos" :disabled="cargando">
        Actualizar datos
      </button>
    </div>

    <div v-if="error" class="alert alert-danger">{{ error }}</div>
    <div v-if="exito" class="alert alert-success">{{ exito }}</div>

    <div v-if="cargando" class="text-center py-5">
      <div class="spinner-border" style="color: var(--secondary)"></div>
      <p class="text-muted mt-2">Cargando informacion...</p>
    </div>

    <div v-else class="row g-4">
      <div class="col-lg-8">
        <section class="panel mb-4">
          <h5 class="fw-bold mb-3">Datos de la ruta</h5>
          <div class="row g-3">
            <div class="col-md-6">
              <label for="nombre" class="form-label">Nombre de la ruta</label>
              <input id="nombre" v-model="form.nombre" type="text" class="form-control" placeholder="Ruta zona centro" />
            </div>
            <div class="col-md-3">
              <label for="fecha_inicio" class="form-label">Fecha inicio</label>
              <input id="fecha_inicio" v-model="form.fecha_inicio" type="date" class="form-control" />
            </div>
            <div class="col-md-3">
              <label for="periodicidad" class="form-label">Periodicidad</label>
              <select id="periodicidad" v-model="form.periodicidad" class="form-select">
                <option value="semanal">Semanal</option>
                <option value="quincenal">Quincenal</option>
                <option value="mensual">Mensual</option>
              </select>
            </div>
            <div class="col-md-6">
              <label for="buscar_cobrador" class="form-label">Buscar cobrador</label>
              <input id="buscar_cobrador" v-model="filtros.cobrador" type="text" class="form-control" placeholder="Nombre o apellidos" />
            </div>
            <div class="col-md-6">
              <label for="cobrador" class="form-label">Cobrador asignado</label>
              <select id="cobrador" v-model="form.cobradores_id" class="form-select">
                <option value="" disabled>Selecciona un cobrador</option>
                <option v-for="item in cobradoresFiltrados" :key="item.cobrador.cobrador_id" :value="item.cobrador.cobrador_id">
                  {{ nombreCobrador(item) }}
                </option>
              </select>
            </div>
          </div>
        </section>

        <section class="panel">
          <div class="d-flex justify-content-between align-items-start gap-3 flex-wrap mb-3">
            <div>
              <h5 class="fw-bold mb-1">Contratos disponibles</h5>
              <small class="text-muted">{{ contratosFiltrados.length }} contrato(s) con saldo pendiente</small>
            </div>
            <button class="btn btn-sm btn-outline-secondary" @click="limpiarFiltros">
              Limpiar filtros
            </button>
          </div>

          <div class="row g-3 mb-3">
            <div class="col-md-3">
              <input v-model="filtros.calle" type="text" class="form-control" placeholder="Calle" />
            </div>
            <div class="col-md-3">
              <input v-model="filtros.colonia" type="text" class="form-control" placeholder="Colonia" />
            </div>
            <div class="col-md-3">
              <input v-model="filtros.horario" type="text" class="form-control" placeholder="Horario" />
            </div>
            <div class="col-md-3">
              <input v-model="filtros.texto" type="text" class="form-control" placeholder="Cliente o contrato" />
            </div>
          </div>

          <div v-if="contratosFiltrados.length === 0" class="empty-state">
            No hay contratos que coincidan con los filtros.
          </div>

          <div v-else class="table-responsive">
            <table class="table table-hover align-middle mb-0">
              <thead class="thead-custom">
                <tr>
                  <th class="check-col"></th>
                  <th>Contrato</th>
                  <th>Cliente</th>
                  <th>Direccion de cobro</th>
                  <th>Horario</th>
                  <th class="text-end">Saldo</th>
                </tr>
              </thead>
              <tbody>
                <tr
                  v-for="contrato in contratosFiltrados"
                  :key="contrato.contratos_id"
                  :class="{ seleccionado: estaSeleccionado(contrato.contratos_id) }"
                >
                  <td>
                    <input
                      class="form-check-input"
                      type="checkbox"
                      :checked="estaSeleccionado(contrato.contratos_id)"
                      @change="alternarContrato(contrato)"
                    />
                  </td>
                  <td>
                    <strong>{{ contrato.num_contrato ?? contrato.contratos_id }}</strong>
                    <small class="d-block text-muted">{{ contrato.frecuencia_pago }}</small>
                  </td>
                  <td>{{ nombreCliente(contrato) }}</td>
                  <td>
                    {{ formatoDireccion(contrato.direccion_cobro) }}
                    <small v-if="contrato.direccion_cobro?.referencia" class="d-block text-muted">
                      {{ contrato.direccion_cobro.referencia }}
                    </small>
                  </td>
                  <td>{{ contrato.direccion_cobro?.horario_atencion ?? 'Sin horario' }}</td>
                  <td class="text-end fw-semibold">{{ formatoMoneda(saldoPendiente(contrato)) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <div class="col-lg-4">
        <aside class="panel sticky-panel">
          <div class="d-flex justify-content-between align-items-center mb-3">
            <h5 class="fw-bold mb-0">Orden de visita</h5>
            <span class="badge bg-secondary">{{ contratosSeleccionados.length }}</span>
          </div>

          <div v-if="contratosSeleccionados.length === 0" class="empty-state compact">
            Marca contratos para agregarlos a la ruta.
          </div>

          <div v-else class="orden-list">
            <div v-for="(contrato, index) in contratosSeleccionados" :key="contrato.contratos_id" class="orden-item">
              <div class="orden-num">{{ index + 1 }}</div>
              <div class="orden-info">
                <strong>{{ contrato.num_contrato ?? contrato.contratos_id }}</strong>
                <small>{{ nombreCliente(contrato) }}</small>
                <small>{{ formatoDireccion(contrato.direccion_cobro) }}</small>
              </div>
              <div class="orden-actions">
                <button class="btn btn-sm btn-outline-secondary" @click="moverContrato(index, -1)" :disabled="index === 0" title="Subir">
                  ↑
                </button>
                <button class="btn btn-sm btn-outline-secondary" @click="moverContrato(index, 1)" :disabled="index === contratosSeleccionados.length - 1" title="Bajar">
                  ↓
                </button>
                <button class="btn btn-sm btn-outline-danger" @click="quitarContrato(contrato.contratos_id)" title="Quitar">
                  ×
                </button>
              </div>
            </div>
          </div>

          <div class="acciones-finales">
            <button class="btn btn-outline-secondary" @click="cancelar" :disabled="enviando">
              Cancelar
            </button>
            <button class="btn btn-custom" @click="guardarRuta" :disabled="!puedeGuardar">
              <span v-if="enviando" class="spinner-border spinner-border-sm me-2"></span>
              {{ enviando ? 'Guardando...' : 'Crear ruta' }}
            </button>
          </div>
        </aside>
      </div>
    </div>
  </div>
</template>

<style scoped>
.panel {
  background: #fff;
  border: 1px solid #e5edf2;
  border-radius: 8px;
  padding: 18px;
  box-shadow: 0 2px 12px rgba(47, 65, 86, 0.08);
}

.sticky-panel {
  position: sticky;
  top: 86px;
}

.thead-custom th {
  background: var(--primary);
  color: #fff;
  font-weight: 600;
  padding: 12px 14px;
}

.check-col {
  width: 44px;
}

tr.seleccionado td {
  background: #f1f7fa;
}

.empty-state {
  border: 1px dashed #c8d9e6;
  border-radius: 8px;
  color: #667085;
  padding: 36px 18px;
  text-align: center;
}

.empty-state.compact {
  padding: 24px 12px;
}

.orden-list {
  display: grid;
  gap: 10px;
  max-height: 58vh;
  overflow: auto;
  padding-right: 2px;
}

.orden-item {
  display: grid;
  grid-template-columns: 34px 1fr auto;
  gap: 10px;
  align-items: center;
  border: 1px solid #e5edf2;
  border-radius: 8px;
  padding: 10px;
}

.orden-num {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  background: var(--secondary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
}

.orden-info {
  min-width: 0;
}

.orden-info small {
  display: block;
  color: #667085;
  overflow-wrap: anywhere;
}

.orden-actions {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.orden-actions .btn {
  width: 34px;
  height: 30px;
  padding: 0;
}

.acciones-finales {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid #edf2f5;
}

@media (max-width: 991px) {
  .sticky-panel {
    position: static;
  }

  .orden-list {
    max-height: none;
  }
}
</style>
