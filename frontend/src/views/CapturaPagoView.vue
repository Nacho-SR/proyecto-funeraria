<script setup>
import CapturaPago from '@/components/CapturaPago.vue'
import { useRouter } from 'vue-router'

const router = useRouter()

function onGuardado(pago) {
  console.log('Pago registrado:', pago)
}

function onCancelado() {
  router.back()
}
</script>

<template>
  <div class="container py-4">
    <div class="row justify-content-center">
      <div class="col-lg-10">
        <div class="card shadow-sm">
          <div class="card-header bg-white">
            <h3 class="mb-0">Captura de pago</h3>
            <small class="text-muted">Registro de un nuevo pago</small>
          </div>
          <div class="card-body">
            <CapturaPago @guardado="onGuardado" @cancelado="onCancelado" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>