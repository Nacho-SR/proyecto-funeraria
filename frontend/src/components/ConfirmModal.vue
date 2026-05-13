<script setup>
const props = defineProps({
  show: Boolean,
  titulo: { type: String, default: 'Confirmar baja' },
  mensaje: { type: String, default: '¿Estás seguro de que deseas dar de baja este registro? Esta acción puede revertirse.' },
  cargando: Boolean,
})
const emit = defineEmits(['confirmar', 'cancelar'])
</script>

<template>
  <!-- Backdrop -->
  <Teleport to="body">
    <div v-if="show" class="modal-backdrop-custom" @click.self="emit('cancelar')">
      <div class="modal-box shadow-lg">
        <div class="modal-box__header">
          <span class="modal-box__icon">⚠️</span>
          <h5 class="modal-box__titulo">{{ titulo }}</h5>
        </div>
        <p class="modal-box__mensaje">{{ mensaje }}</p>
        <div class="modal-box__acciones">
          <button
            class="btn btn-outline-secondary"
            @click="emit('cancelar')"
            :disabled="cargando"
          >
            Cancelar
          </button>
          <button
            class="btn btn-danger"
            @click="emit('confirmar')"
            :disabled="cargando"
          >
            <span v-if="cargando" class="spinner-border spinner-border-sm me-1"></span>
            {{ cargando ? 'Procesando...' : 'Dar de baja' }}
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-backdrop-custom {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1050;
  animation: fadeIn 0.15s ease;
}
@keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }

.modal-box {
  background: #fff;
  border-radius: 16px;
  padding: 32px;
  max-width: 420px;
  width: 90%;
  animation: slideUp 0.2s ease;
}
@keyframes slideUp { from { transform: translateY(20px); opacity: 0 } to { transform: none; opacity: 1 } }

.modal-box__header {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}
.modal-box__icon { font-size: 1.5rem; }
.modal-box__titulo { margin: 0; font-weight: 700; color: #2F4156; }
.modal-box__mensaje { color: #555; margin-bottom: 24px; line-height: 1.5; }
.modal-box__acciones { display: flex; justify-content: flex-end; gap: 10px; }
</style>
