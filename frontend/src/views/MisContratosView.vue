<script setup>
import { computed, onMounted, ref } from 'vue'
import { clienteContratosService } from '@/services/clienteContratos.service'

const contratos = ref([])
const seleccionadoId = ref(null)
const cargando = ref(false)
const error = ref('')

const contratoSeleccionado = computed(() =>
  contratos.value.find(contrato => contrato.contratos_id === seleccionadoId.value) ?? contratos.value[0] ?? null
)

const totalSaldo = computed(() =>
  contratos.value.reduce((total, contrato) => total + saldoPendiente(contrato), 0)
)

const totalPorValidar = computed(() =>
  contratos.value.reduce((total, contrato) => total + Number(contrato.resumen_pagos?.monto_por_validar ?? 0), 0)
)

async function cargarContratos() {
  cargando.value = true
  error.value = ''

  try {
    const { data } = await clienteContratosService.listarMisContratos()
    contratos.value = data.contratos ?? []
    seleccionadoId.value = contratos.value[0]?.contratos_id ?? null
  } catch (err) {
    error.value = err.response?.data?.error ?? 'No se pudieron cargar tus contratos.'
  } finally {
    cargando.value = false
  }
}

function seleccionarContrato(contrato) {
  seleccionadoId.value = contrato.contratos_id
}

function saldoPendiente(contrato) {
  return Math.max(Number(contrato.precio_final ?? 0) - Number(contrato.abonado ?? 0), 0)
}

function avanceContrato(contrato) {
  const precio = Number(contrato.precio_final ?? 0)
  if (!precio) return 0
  return Math.min(Math.round((Number(contrato.abonado ?? 0) / precio) * 100), 100)
}

function formatoMoneda(valor) {
  return Number(valor ?? 0).toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN'
  })
}

function fechaValor(fecha) {
  if (!fecha) return null
  if (typeof fecha.toDate === 'function') return fecha.toDate()
  if (fecha.seconds || fecha._seconds) return new Date((fecha.seconds ?? fecha._seconds) * 1000)
  const parsed = new Date(fecha)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

function formatoFecha(fecha) {
  const valor = fechaValor(fecha)
  return valor ? valor.toLocaleDateString('es-MX') : '-'
}

function direccionCompleta(direccion) {
  if (!direccion) return 'Sin direccion de cobro'
  return [
    direccion.calle,
    direccion.num_casa,
    direccion.colonia
  ].filter(Boolean).join(', ') || 'Sin direccion de cobro'
}

function nombreBeneficiario(beneficiario) {
  return [
    beneficiario.nombre,
    beneficiario.apaterno,
    beneficiario.amaterno
  ].filter(Boolean).join(' ')
}

onMounted(cargarContratos)
</script>

<template>
  <div class="container py-4">
    <div class="d-flex justify-content-between align-items-start gap-3 flex-wrap mb-4">
      <div>
        <h2 class="fw-bold mb-1" style="color: var(--primary)">Mis contratos</h2>
        <small class="text-muted">{{ contratos.length }} contrato(s) activo(s)</small>
      </div>
      <button class="btn btn-outline-secondary" type="button" :disabled="cargando" @click="cargarContratos">
        Actualizar
      </button>
    </div>

    <div v-if="error" class="alert alert-warning">{{ error }}</div>

    <div v-if="cargando" class="text-center py-5">
      <div class="spinner-border" style="color:var(--secondary)"></div>
      <p class="text-muted mt-2 mb-0">Cargando contratos...</p>
    </div>

    <div v-else-if="contratos.length === 0 && !error" class="empty-state">
      No tienes contratos activos.
    </div>

    <template v-else>
      <div class="summary-strip mb-4">
        <div>
          <span>Saldo pendiente</span>
          <strong>{{ formatoMoneda(totalSaldo) }}</strong>
        </div>
        <div>
          <span>Pagos por validar</span>
          <strong>{{ formatoMoneda(totalPorValidar) }}</strong>
        </div>
      </div>

      <div class="contracts-layout">
        <section class="contracts-list" aria-label="Contratos activos">
          <button
            v-for="contrato in contratos"
            :key="contrato.contratos_id"
            type="button"
            class="contract-card"
            :class="{ activo: contrato.contratos_id === contratoSeleccionado?.contratos_id }"
            @click="seleccionarContrato(contrato)"
          >
            <div class="contract-card__top">
              <div>
                <span class="label">Contrato</span>
                <strong>{{ contrato.num_contrato ?? contrato.contratos_id }}</strong>
              </div>
              <span class="status-badge">{{ contrato.estado ?? 'activo' }}</span>
            </div>

            <div class="contract-card__body">
              <p class="mb-1 fw-semibold">{{ contrato.paquete?.nombre ?? 'Paquete sin nombre' }}</p>
              <small class="text-muted text-capitalize">{{ contrato.frecuencia_pago ?? 'Sin frecuencia' }}</small>
            </div>

            <div class="progress contract-progress" role="progressbar" :aria-valuenow="avanceContrato(contrato)" aria-valuemin="0" aria-valuemax="100">
              <div class="progress-bar" :style="{ width: `${avanceContrato(contrato)}%` }"></div>
            </div>

            <div class="contract-card__amounts">
              <span>{{ formatoMoneda(contrato.abonado) }} abonado</span>
              <strong>{{ formatoMoneda(saldoPendiente(contrato)) }}</strong>
            </div>
          </button>
        </section>

        <section v-if="contratoSeleccionado" class="contract-detail" aria-label="Detalle del contrato">
          <div class="detail-header">
            <div>
              <span class="label">Detalle</span>
              <h4 class="fw-bold mb-0">{{ contratoSeleccionado.num_contrato ?? contratoSeleccionado.contratos_id }}</h4>
            </div>
            <span class="status-badge">{{ contratoSeleccionado.estado ?? 'activo' }}</span>
          </div>

          <div class="detail-grid">
            <div>
              <span>Paquete</span>
              <strong>{{ contratoSeleccionado.paquete?.nombre ?? 'Sin paquete' }}</strong>
            </div>
            <div>
              <span>Fecha de inicio</span>
              <strong>{{ formatoFecha(contratoSeleccionado.fecha_inicio) }}</strong>
            </div>
            <div>
              <span>Frecuencia</span>
              <strong class="text-capitalize">{{ contratoSeleccionado.frecuencia_pago ?? '-' }}</strong>
            </div>
            <div>
              <span>Precio total</span>
              <strong>{{ formatoMoneda(contratoSeleccionado.precio_final) }}</strong>
            </div>
            <div>
              <span>Abonado</span>
              <strong>{{ formatoMoneda(contratoSeleccionado.abonado) }}</strong>
            </div>
            <div>
              <span>Saldo pendiente</span>
              <strong>{{ formatoMoneda(saldoPendiente(contratoSeleccionado)) }}</strong>
            </div>
          </div>

          <div class="detail-section">
            <h6>Direccion de cobro</h6>
            <p class="mb-1">{{ direccionCompleta(contratoSeleccionado.direccion_cobro) }}</p>
            <small class="text-muted">
              {{ contratoSeleccionado.direccion_cobro?.referencia ?? 'Sin referencia' }}
              <span v-if="contratoSeleccionado.direccion_cobro?.horario_atencion">
                - {{ contratoSeleccionado.direccion_cobro.horario_atencion }}
              </span>
            </small>
          </div>

          <div class="detail-section">
            <h6>Adicionales</h6>
            <div v-if="contratoSeleccionado.adicionales?.length" class="pill-list">
              <span v-for="item in contratoSeleccionado.adicionales" :key="item.contrato_adicionales_id" class="info-pill">
                {{ item.adicional?.nombre ?? 'Adicional' }} - {{ formatoMoneda(item.precio_unitario ?? item.adicional?.precio) }}
              </span>
            </div>
            <p v-else class="text-muted mb-0">Sin adicionales.</p>
          </div>

          <div class="detail-section">
            <h6>Beneficiarios</h6>
            <div v-if="contratoSeleccionado.beneficiarios?.length" class="beneficiarios-list">
              <div v-for="beneficiario in contratoSeleccionado.beneficiarios" :key="beneficiario.beneficiario_id">
                <strong>{{ nombreBeneficiario(beneficiario) }}</strong>
                <span>{{ beneficiario.parentesco ?? 'Sin parentesco' }}</span>
              </div>
            </div>
            <p v-else class="text-muted mb-0">Sin beneficiarios registrados.</p>
          </div>

          <div v-if="contratoSeleccionado.resumen_pagos?.por_validar" class="validation-note">
            <strong>{{ formatoMoneda(contratoSeleccionado.resumen_pagos.monto_por_validar) }}</strong>
            <span>en pago(s) por validar.</span>
          </div>
        </section>
      </div>
    </template>
  </div>
</template>

<style scoped>
.summary-strip {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.summary-strip > div,
.contract-detail,
.contract-card,
.empty-state {
  background: #fff;
  border: 1px solid #e7ecef;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(47, 65, 86, 0.06);
}

.summary-strip > div {
  padding: 16px 18px;
}

.summary-strip span,
.detail-grid span,
.label {
  display: block;
  color: #667985;
  font-size: 0.78rem;
  font-weight: 600;
  text-transform: uppercase;
}

.summary-strip strong {
  display: block;
  color: var(--primary);
  font-size: 1.2rem;
}

.contracts-layout {
  display: grid;
  grid-template-columns: minmax(280px, 380px) minmax(0, 1fr);
  gap: 18px;
  align-items: start;
}

.contracts-list {
  display: grid;
  gap: 12px;
}

.contract-card {
  text-align: left;
  padding: 16px;
  transition: border-color 0.18s, box-shadow 0.18s, transform 0.18s;
}

.contract-card:hover,
.contract-card.activo {
  border-color: var(--secondary);
  box-shadow: 0 6px 18px rgba(47, 65, 86, 0.12);
}

.contract-card.activo {
  transform: translateY(-1px);
}

.contract-card__top,
.contract-card__amounts,
.detail-header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.contract-card__body {
  margin: 14px 0;
}

.contract-card__amounts {
  margin-top: 10px;
  color: #667985;
  font-size: 0.88rem;
}

.contract-card__amounts strong {
  color: var(--primary);
}

.contract-progress {
  height: 8px;
  background: #edf2f4;
}

.contract-progress .progress-bar {
  background: var(--secondary);
}

.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: #e8f3ef;
  color: #2f6b54;
  padding: 4px 10px;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: capitalize;
  white-space: nowrap;
}

.contract-detail {
  padding: 22px;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin: 22px 0;
}

.detail-grid > div {
  border-bottom: 1px solid #edf2f4;
  padding-bottom: 10px;
}

.detail-grid strong {
  display: block;
  color: var(--primary);
  margin-top: 4px;
}

.detail-section {
  border-top: 1px solid #edf2f4;
  padding-top: 16px;
  margin-top: 16px;
}

.detail-section h6 {
  color: var(--primary);
  font-weight: 700;
  margin-bottom: 10px;
}

.pill-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.info-pill {
  border: 1px solid #d8e3e8;
  border-radius: 999px;
  padding: 6px 10px;
  color: var(--primary);
  font-size: 0.86rem;
  background: #f8fbfc;
}

.beneficiarios-list {
  display: grid;
  gap: 8px;
}

.beneficiarios-list > div {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid #edf2f4;
  padding-bottom: 8px;
}

.beneficiarios-list span {
  color: #667985;
}

.validation-note {
  display: flex;
  gap: 6px;
  align-items: center;
  margin-top: 16px;
  padding: 12px 14px;
  border-radius: 8px;
  background: #fff8e5;
  color: #785b14;
}

.empty-state {
  padding: 48px 18px;
  text-align: center;
  color: #667985;
}

@media (max-width: 992px) {
  .contracts-layout,
  .summary-strip,
  .detail-grid {
    grid-template-columns: 1fr;
  }
}
</style>
