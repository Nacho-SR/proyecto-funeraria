<script setup>
import AltaPaquete from '@/components/AltaPaquete.vue'
// import { useRouter } from 'vue-router'
// const router = useRouter()

function onGuardado(paquete) {
  console.log('Paquete registrado:', paquete)
  // Si tienen router, redirigir al listado:
  // router.push({ name: 'paquetes' })
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
            <h3 class="mb-0">Alta de paquete</h3>
            <small class="text-muted">Registro de un nuevo paquete de servicios funerarios</small>
          </div>
          <div class="card-body">
            <AltaPaquete @guardado="onGuardado" @cancelado="onCancelado" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
