<script setup>
import { computed, onMounted, ref } from 'vue'
import { clienteProductosService } from '@/services/clienteProductos.service'

const paquetes = ref([])
const adicionales = ref([])
const promociones = ref([])
const cargando = ref(false)
const error = ref('')
const tab = ref('paquetes')
const busqueda = ref('')

const tabs = [
  { id: 'paquetes', label: 'Paquetes' },
  { id: 'promociones', label: 'Promociones' },
  { id: 'adicionales', label: 'Adicionales' }
]

const resumen = computed(() => ({
  paquetes: paquetes.value.length,
  promociones: promociones.value.length,
  adicionales: adicionales.value.length
}))

const paquetesFiltrados = computed(() =>
  filtrarPorTexto(paquetes.value, paquete => [
    paquete.nombre,
    paquete.descripcion
  ])
)

const adicionalesFiltrados = computed(() =>
  filtrarPorTexto(adicionales.value, adicional => [
    adicional.nombre,
    adicional.descripcion
  ])
)

const promocionesFiltradas = computed(() =>
  filtrarPorTexto(promociones.value, promo => [
    promo.paquete?.nombre,
    promo.adicional?.nombre,
    promo.adicional?.descripcion
  ])
)

const paqueteDestacado = computed(() =>
  [...paquetes.value].sort((a, b) => Number(a.precio_base ?? 0) - Number(b.precio_base ?? 0))[0] ?? null
)

const mejorPromocion = computed(() =>
  [...promociones.value].sort((a, b) => Number(b.ahorro ?? 0) - Number(a.ahorro ?? 0))[0] ?? null
)

async function cargarProductos() {
  cargando.value = true
  error.value = ''

  try {
    const { data } = await clienteProductosService.listarActivos()
    const productos = data.productos ?? {}
    paquetes.value = productos.paquetes ?? []
    adicionales.value = productos.adicionales ?? []
    promociones.value = productos.promociones ?? []
  } catch (err) {
    error.value = err.response?.data?.error ?? 'No se pudieron cargar los productos activos.'
  } finally {
    cargando.value = false
  }
}

function filtrarPorTexto(lista, campos) {
  const q = busqueda.value.trim().toLowerCase()
  if (!q) return lista

  return lista.filter(item =>
    campos(item).filter(Boolean).join(' ').toLowerCase().includes(q)
  )
}

function formatoMoneda(valor) {
  return Number(valor ?? 0).toLocaleString('es-MX', {
    style: 'currency',
    currency: 'MXN'
  })
}

function ahorroPorcentaje(promo) {
  const original = Number(promo.precio_original ?? 0)
  const ahorro = Number(promo.ahorro ?? 0)
  if (!original || !ahorro) return 0
  return Math.round((ahorro / original) * 100)
}

onMounted(cargarProductos)
</script>

<template>
  <div class="catalog-page">
    <section class="catalog-hero">
      <div class="container catalog-hero__inner">
        <div>
          <span class="eyebrow">Catalogo activo</span>
          <h2>Productos y promociones</h2>
          <p>Consulta los paquetes disponibles, adicionales vigentes y promociones aplicables.</p>
        </div>
        <div class="hero-metrics">
          <div>
            <strong>{{ resumen.paquetes }}</strong>
            <span>Paquetes</span>
          </div>
          <div>
            <strong>{{ resumen.promociones }}</strong>
            <span>Promos</span>
          </div>
          <div>
            <strong>{{ resumen.adicionales }}</strong>
            <span>Adicionales</span>
          </div>
        </div>
      </div>
    </section>

    <div class="container py-4">
      <div v-if="error" class="alert alert-warning">{{ error }}</div>

      <div class="catalog-toolbar mb-4">
        <div class="catalog-tabs" role="tablist" aria-label="Secciones del catalogo">
          <button
            v-for="item in tabs"
            :key="item.id"
            type="button"
            class="catalog-tab"
            :class="{ activo: tab === item.id }"
            @click="tab = item.id"
          >
            {{ item.label }}
          </button>
        </div>

        <input
          v-model="busqueda"
          type="text"
          class="form-control catalog-search"
          placeholder="Buscar producto o promocion"
        />
      </div>

      <div v-if="cargando" class="text-center py-5">
        <div class="spinner-border" style="color:var(--secondary)"></div>
        <p class="text-muted mt-2 mb-0">Cargando catalogo...</p>
      </div>

      <template v-else>
        <section v-if="tab === 'paquetes'">
          <div class="feature-band mb-4" v-if="paqueteDestacado">
            <div>
              <span class="eyebrow">Paquete desde</span>
              <h4>{{ paqueteDestacado.nombre }}</h4>
              <p>{{ paqueteDestacado.descripcion }}</p>
            </div>
            <strong>{{ formatoMoneda(paqueteDestacado.precio_base) }}</strong>
          </div>

          <div v-if="paquetesFiltrados.length === 0" class="empty-state">
            No hay paquetes que coincidan con la busqueda.
          </div>

          <div v-else class="product-grid">
            <article v-for="paquete in paquetesFiltrados" :key="paquete.paquete_id" class="product-card package-card">
              <div class="product-card__mark">P</div>
              <div class="product-card__content">
                <h5>{{ paquete.nombre }}</h5>
                <p>{{ paquete.descripcion }}</p>
                <div class="price-row">
                  <span>Precio base</span>
                  <strong>{{ formatoMoneda(paquete.precio_base) }}</strong>
                </div>
              </div>
            </article>
          </div>
        </section>

        <section v-if="tab === 'promociones'">
          <div class="feature-band promo-feature mb-4" v-if="mejorPromocion">
            <div>
              <span class="eyebrow">Mayor ahorro vigente</span>
              <h4>{{ mejorPromocion.adicional?.nombre }} con {{ mejorPromocion.paquete?.nombre }}</h4>
              <p>Ahorro estimado de {{ formatoMoneda(mejorPromocion.ahorro) }} sobre el adicional.</p>
            </div>
            <strong>{{ ahorroPorcentaje(mejorPromocion) }}%</strong>
          </div>

          <div v-if="promocionesFiltradas.length === 0" class="empty-state">
            No hay promociones que coincidan con la busqueda.
          </div>

          <div v-else class="promo-grid">
            <article v-for="promo in promocionesFiltradas" :key="promo.promo_id" class="promo-card">
              <div class="promo-card__header">
                <span>Promocion</span>
                <strong v-if="promo.ahorro > 0">{{ ahorroPorcentaje(promo) }}% menos</strong>
              </div>
              <h5>{{ promo.adicional?.nombre }}</h5>
              <p>{{ promo.adicional?.descripcion }}</p>
              <div class="promo-package">
                Aplica con <strong>{{ promo.paquete?.nombre }}</strong>
              </div>
              <div class="promo-prices">
                <span>{{ formatoMoneda(promo.precio_original) }}</span>
                <strong>{{ formatoMoneda(promo.precio_especial) }}</strong>
              </div>
            </article>
          </div>
        </section>

        <section v-if="tab === 'adicionales'">
          <div v-if="adicionalesFiltrados.length === 0" class="empty-state">
            No hay adicionales que coincidan con la busqueda.
          </div>

          <div v-else class="product-grid">
            <article v-for="adicional in adicionalesFiltrados" :key="adicional.adicional_id" class="product-card addon-card">
              <div class="product-card__mark">A</div>
              <div class="product-card__content">
                <h5>{{ adicional.nombre }}</h5>
                <p>{{ adicional.descripcion }}</p>
                <div class="price-row">
                  <span>Precio</span>
                  <strong>{{ formatoMoneda(adicional.precio) }}</strong>
                </div>
              </div>
            </article>
          </div>
        </section>
      </template>
    </div>
  </div>
</template>

<style scoped>
.catalog-page {
  background: #f5f7f8;
  min-height: calc(100vh - 64px);
}

.catalog-hero {
  background: linear-gradient(135deg, #2f4156 0%, #567c8d 56%, #f2b84b 100%);
  color: #fff;
}

.catalog-hero__inner {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 28px;
  padding-top: 34px;
  padding-bottom: 34px;
}

.catalog-hero h2 {
  font-weight: 800;
  margin: 4px 0 8px;
}

.catalog-hero p {
  max-width: 620px;
  margin: 0;
  color: rgba(255, 255, 255, 0.84);
}

.eyebrow {
  display: block;
  color: inherit;
  font-size: 0.76rem;
  font-weight: 800;
  text-transform: uppercase;
  opacity: 0.78;
}

.hero-metrics {
  display: grid;
  grid-template-columns: repeat(3, 86px);
  gap: 10px;
}

.hero-metrics div {
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: 8px;
  padding: 12px 10px;
  text-align: center;
  background: rgba(255, 255, 255, 0.12);
}

.hero-metrics strong {
  display: block;
  font-size: 1.45rem;
}

.hero-metrics span {
  display: block;
  font-size: 0.75rem;
}

.catalog-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 12px;
}

.catalog-tabs {
  display: inline-flex;
  border: 1px solid #d7e1e5;
  border-radius: 8px;
  overflow: hidden;
  background: #fff;
}

.catalog-tab {
  border: 0;
  background: #fff;
  color: var(--primary);
  font-weight: 700;
  padding: 10px 16px;
}

.catalog-tab.activo {
  background: var(--primary);
  color: #fff;
}

.catalog-search {
  max-width: 320px;
  border-radius: 8px;
}

.feature-band,
.empty-state {
  background: #fff;
  border: 1px solid #e2eaee;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(47, 65, 86, 0.08);
}

.feature-band {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: center;
  padding: 20px;
  border-left: 5px solid #3d8f72;
}

.feature-band h4 {
  color: var(--primary);
  font-weight: 800;
  margin: 3px 0 6px;
}

.feature-band p {
  margin: 0;
  color: #61747f;
}

.feature-band > strong {
  color: #2f4156;
  font-size: 1.35rem;
  white-space: nowrap;
}

.promo-feature {
  border-left-color: #d44f4f;
}

.product-grid,
.promo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
  gap: 14px;
}

.product-card,
.promo-card {
  background: #fff;
  border: 1px solid #e2eaee;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(47, 65, 86, 0.08);
}

.product-card {
  display: grid;
  grid-template-columns: 58px minmax(0, 1fr);
  min-height: 190px;
  overflow: hidden;
}

.product-card__mark {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-weight: 900;
  font-size: 1.3rem;
}

.package-card .product-card__mark {
  background: #3d8f72;
}

.addon-card .product-card__mark {
  background: #6f5aa8;
}

.product-card__content,
.promo-card {
  padding: 18px;
}

.product-card h5,
.promo-card h5 {
  color: var(--primary);
  font-weight: 800;
  margin-bottom: 8px;
}

.product-card p,
.promo-card p {
  color: #61747f;
  min-height: 48px;
}

.price-row,
.promo-prices,
.promo-card__header {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.price-row {
  border-top: 1px solid #edf2f4;
  padding-top: 12px;
}

.price-row span,
.promo-card__header span {
  color: #667985;
  font-size: 0.78rem;
  font-weight: 800;
  text-transform: uppercase;
}

.price-row strong,
.promo-prices strong {
  color: var(--primary);
  font-size: 1.1rem;
}

.promo-card {
  border-top: 4px solid #d44f4f;
}

.promo-card__header strong {
  border-radius: 999px;
  background: #fff2e2;
  color: #8a4f00;
  padding: 4px 9px;
  font-size: 0.75rem;
}

.promo-package {
  border-radius: 8px;
  background: #eef5f7;
  color: #405967;
  padding: 10px 12px;
  margin: 14px 0;
}

.promo-prices span {
  color: #8b9aa2;
  text-decoration: line-through;
}

.empty-state {
  padding: 48px 18px;
  text-align: center;
  color: #667985;
}

@media (max-width: 768px) {
  .catalog-hero__inner,
  .feature-band {
    align-items: stretch;
    flex-direction: column;
  }

  .hero-metrics {
    grid-template-columns: repeat(3, 1fr);
  }

  .catalog-search {
    max-width: none;
    width: 100%;
  }

  .catalog-tabs {
    width: 100%;
  }

  .catalog-tab {
    flex: 1;
  }
}
</style>
