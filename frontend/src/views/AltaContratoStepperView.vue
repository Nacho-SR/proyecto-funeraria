<script setup>
import AltaContratoStepper from '@/components/AltaContratoStepper.vue'
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
        <div class="card shadow-sm" style="border-radius: 16px;">
          <div class="card-body p-4 p-md-5">
            <AltaContratoStepper @guardado="onGuardado" @cancelado="onCancelado" />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>