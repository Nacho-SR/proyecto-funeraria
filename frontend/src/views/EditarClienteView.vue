<script setup>
import EditarCliente from '@/components/EditarCliente.vue'
import { useRouter } from 'vue-router'

const router = useRouter()

function onGuardado() {
  router.back()
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
            <h3 class="mb-0">Editar cliente</h3>
            <small class="text-muted">Modificar información del cliente</small>
          </div>
          <div class="card-body">
            <EditarCliente @guardado="onGuardado" @cancelado="onCancelado" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>