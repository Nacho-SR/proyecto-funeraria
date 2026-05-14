<script setup>
import AltaCliente from '@/components/AltaCliente.vue'

function onGuardado(cliente) {
  console.log('Cliente registrado:', cliente)
 
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
            <h3 class="mb-0">Alta de cliente</h3>
            <small class="text-muted">Registro de un nuevo cliente</small>
          </div>
          <div class="card-body">
            <AltaCliente @guardado="onGuardado" @cancelado="onCancelado" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
