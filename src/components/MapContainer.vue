<template>
  <div ref="containerRef" class="map-container"></div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, defineExpose } from 'vue';
import { initD3Scene } from '../services/d3-map';

const containerRef = ref(null);
let d3Instance = null;

const emit = defineEmits(['band-selected', 'progress', 'loaded']);

onMounted(() => {
  if (containerRef.value) {
    d3Instance = initD3Scene(
      containerRef.value, 
      (band) => emit('band-selected', band),
      (progress) => emit('progress', progress),
      () => emit('loaded')
    );
  }
});

onUnmounted(() => {
  // SVG elements are managed by Vue's lifecycle and will be removed.
  // No specific cleanup needed for this D3 implementation.
});

const resetView = () => {
  if (d3Instance) {
    d3Instance.resetView();
  }
};

defineExpose({
  resetView
});
</script>

<style scoped>
.map-container {
  width: 100%;
  height: 100%;
  display: block;
}

/* Style for D3 generated SVG elements */
:deep(.province) {
  cursor: pointer;
  transition: fill 0.2s ease-in-out;
}
</style> 