<script setup>
import { computed, onMounted, ref } from 'vue'
import { clienteContratosService } from '@/services/clienteContratos.service'

const beneficiarios = ref([])
const cargando = ref(false)
const error = ref('')
const busqueda = ref('')
const filtroContrato = ref('todos')

const contratosDisponibles = computed(() => {
  const mapa = new Map()
  beneficiarios.value.forEach(beneficiario => {
    const id = beneficiario.contratos_id
    if (!id) return
    mapa.set(id, beneficiario.num_contrato ?? id)
  })

  return [...mapa.entries()].map(([id, etiqueta]) => ({ id, etiqueta }))
})

const beneficiariosFiltrados = computed(() => {
  const q = busqueda.value.trim().toLowerCase()

  return beneficiarios.value.filter(beneficiario => {
    const texto = [
      nombreCompleto(beneficiario),
      beneficiario.parentesco,
      beneficiario.telefono,
      beneficiario.num_contrato,
      beneficiario.paquete?.nombre
    ].filter(Boolean).join(' ').toLowerCase()

    const coincideTexto = !q || texto.includes(q)
    const coincideContrato = filtroContrato.value === 'todos' || beneficiario.contratos_id === filtroContrato.value

    return coincideTexto && coincideContrato
  })
})

async function cargarBeneficiarios() {
  cargando.value = true
  error.value = ''

  try {
    const { data } = await clienteContratosService.listarMisBeneficiarios()
    beneficiarios.value = data.beneficiarios ?? []
  } catch (err) {
    error.value = err.response?.data?.error ?? 'No se pudieron cargar tus beneficiarios.'
  } finally {
    cargando.value = false
  }
}

function nombreCompleto(beneficiario) {
  return [
    beneficiario.nombre,
    beneficiario.apaterno,
    beneficiario.amaterno
  ].filter(Boolean).join(' ') || 'Sin nombre'
}

function iniciales(beneficiario) {
  return nombreCompleto(beneficiario)
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(parte => parte[0])
    .join('')
    .toUpperCase()
}

onMounted(cargarBeneficiarios)
</script>

<template>
  <div class="container py-4">
    <div class="d-flex justify-content-between align-items-start gap-3 flex-wrap mb-4">
      <div>
        <h2 class="fw-bold mb-1" style="color: var(--primary)">Mis beneficiarios</h2>
        <small class="text-muted">{{ beneficiariosFiltrados.length }} beneficiario(s)</small>
      </div>
      <button class="btn btn-outline-secondary" type="button" :disabled="cargando" @click="cargarBeneficiarios">
        Actualizar
      </button>
    </div>

    <div v-if="error" class="alert alert-warning">{{ error }}</div>

    <div v-if="cargando" class="text-center py-5">
      <div class="spinner-border" style="color:var(--secondary)"></div>
      <p class="text-muted mt-2 mb-0">Cargando beneficiarios...</p>
    </div>

    <template v-else>
      <div class="filters-bar mb-4">
        <input
          v-model="busqueda"
          class="form-control filter-input"
          type="text"
          placeholder="Buscar por nombre, parentesco, telefono o contrato"
        />

        <select v-model="filtroContrato" class="form-select filter-select">
          <option value="todos">Todos los contratos</option>
          <option v-for="contrato in contratosDisponibles" :key="contrato.id" :value="contrato.id">
            {{ contrato.etiqueta }}
          </option>
        </select>
      </div>

      <div v-if="beneficiariosFiltrados.length === 0" class="empty-state">
        No hay beneficiarios que coincidan con los filtros.
      </div>

      <div v-else class="beneficiarios-grid">
        <article
          v-for="beneficiario in beneficiariosFiltrados"
          :key="beneficiario.beneficiario_id"
          class="beneficiario-card"
        >
          <div class="beneficiario-card__top">
            <div class="avatar">{{ iniciales(beneficiario) }}</div>
            <div>
              <h5 class="mb-1">{{ nombreCompleto(beneficiario) }}</h5>
              <span class="relationship">{{ beneficiario.parentesco ?? 'Sin parentesco' }}</span>
            </div>
          </div>

          <dl class="beneficiario-data">
            <div>
              <dt>Contrato</dt>
              <dd>{{ beneficiario.num_contrato ?? beneficiario.contratos_id ?? '-' }}</dd>
            </div>
            <div>
              <dt>Paquete</dt>
              <dd>{{ beneficiario.paquete?.nombre ?? '-' }}</dd>
            </div>
            <div>
              <dt>Telefono</dt>
              <dd>{{ beneficiario.telefono ?? '-' }}</dd>
            </div>
            <div>
              <dt>Direccion</dt>
              <dd>{{ beneficiario.direccion ?? '-' }}</dd>
            </div>
          </dl>
        </article>
      </div>
    </template>
  </div>
</template>

<style scoped>
.filters-bar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.filter-input {
  max-width: 390px;
  border-radius: 8px;
}

.filter-select {
  max-width: 240px;
  border-radius: 8px;
}

.beneficiarios-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 14px;
}

.beneficiario-card,
.empty-state {
  background: #fff;
  border: 1px solid #e7ecef;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(47, 65, 86, 0.06);
}

.beneficiario-card {
  padding: 18px;
}

.beneficiario-card__top {
  display: flex;
  gap: 12px;
  align-items: center;
  padding-bottom: 14px;
  border-bottom: 1px solid #edf2f4;
}

.avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: var(--secondary);
  color: #fff;
  font-weight: 800;
}

.relationship {
  display: inline-flex;
  border-radius: 999px;
  background: #e8f3ef;
  color: #2f6b54;
  padding: 3px 9px;
  font-size: 0.78rem;
  font-weight: 700;
}

.beneficiario-data {
  display: grid;
  gap: 10px;
  margin: 14px 0 0;
}

.beneficiario-data div {
  display: grid;
  gap: 2px;
}

.beneficiario-data dt {
  color: #667985;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}

.beneficiario-data dd {
  margin: 0;
  color: var(--primary);
  font-weight: 600;
}

.empty-state {
  padding: 48px 18px;
  text-align: center;
  color: #667985;
}

@media (max-width: 768px) {
  .filter-input,
  .filter-select {
    max-width: none;
    width: 100%;
  }
}
</style>
