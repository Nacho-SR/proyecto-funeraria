<script setup>
import AltaCobrador from '@/components/AltaCobrador.vue'
// import { useRouter } from 'vue-router'
// const router = useRouter()

function onGuardado(cobrador) {
  console.log('Cobrador registrado:', cobrador)
  // router.push({ name: 'cobradores' })
}

function onCancelado() {
  console.log('Operación cancelada')
  // router.back()
}
</script>

<template>
  <div class="container py-4">
    <div class="row justify-content-center">
      <div class="col-lg-10">
        <div class="card shadow-sm">
          <div class="card-header bg-white">
            <h3 class="mb-0">Alta de cobrador</h3>
            <small class="text-muted">Registro de un nuevo cobrador</small>
          </div>
          <div class="card-body">
            <AltaCobrador @guardado="onGuardado" @cancelado="onCancelado" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>