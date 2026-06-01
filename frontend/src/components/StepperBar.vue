<template>
  <div class="stepper-wrapper">
    <div class="stepper-track-bg"></div>
    <div class="stepper-track-progress" :style="{ width: progressWidth }"></div>
    <div class="stepper-nodes">
      <div v-for="(paso, index) in pasos" :key="index" class="stepper-node-wrapper">
        <div class="stepper-circle" :class="{ 'is-inactive': index > pasoActual, 'is-active': index === pasoActual, 'is-completed': index < pasoActual }">
          <svg v-if="index < pasoActual" class="stepper-check" viewBox="0 0 14 11" fill="none">
            <path d="M1 5.5L5 9.5L13 1.5" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <span v-else class="stepper-number">{{ index + 1 }}</span>
        </div>
        <span class="stepper-label" :class="{ 'label-inactive': index > pasoActual, 'label-active': index === pasoActual, 'label-completed': index < pasoActual }">
          {{ paso }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
const props = defineProps({
  pasos: { type: Array, required: true },
  pasoActual: { type: Number, required: true, default: 0 },
})
const progressWidth = computed(() => {
  if (props.pasos.length <= 1) return '0%'
  return `${(props.pasoActual / (props.pasos.length - 1)) * 100}%`
})
</script>

<style scoped>
.stepper-wrapper { position: relative; display: flex; align-items: flex-start; padding: 8px 0 0; }
.stepper-track-bg, .stepper-track-progress { position: absolute; top: 28px; height: 2px; left: 20px; right: 20px; }
.stepper-track-bg { background-color: #ced4da; z-index: 0; }
.stepper-track-progress { background-color: #2F4156; z-index: 1; right: auto; width: 0%; transition: width 0.45s ease; max-width: calc(100% - 40px); }
.stepper-nodes { position: relative; z-index: 2; display: flex; justify-content: space-between; width: 100%; }
.stepper-node-wrapper { display: flex; flex-direction: column; align-items: center; gap: 10px; flex: 1; }
.stepper-circle { width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: 600; font-size: 0.9rem; background-color: #ffffff; transition: all 0.3s ease; }
.stepper-circle.is-inactive { border: 2px solid #ced4da; color: #adb5bd; }
.stepper-circle.is-active { border: 2px solid #2F4156; color: #2F4156; box-shadow: 0 0 0 4px rgba(47,65,86,0.12); }
.stepper-circle.is-completed { border: 2px solid #2F4156; background-color: #2F4156; }
.stepper-check { width: 16px; height: 12px; }
.stepper-label { font-size: 0.78rem; text-align: center; line-height: 1.3; max-width: 90px; transition: color 0.3s ease; }
.label-inactive { color: #adb5bd; }
.label-active { color: #2F4156; font-weight: 600; }
.label-completed { color: #567C8D; }
</style>
