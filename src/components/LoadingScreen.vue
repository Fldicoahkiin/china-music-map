<template>
  <div class="loading-overlay">
    <div class="loading-container">
      <div class="progress-bar-background">
        <div class="progress-bar left" :style="{ width: progress + '%' }"></div>
        <div class="progress-bar right" :style="{ width: progress + '%' }"></div>
      </div>
      <div class="progress-percentage">{{ Math.round(progress) }}%</div>
    </div>
  </div>
</template>

<script setup>
defineProps({
  progress: {
    type: Number,
    required: true,
    default: 0,
  },
});
</script>

<style scoped>
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #e0e0e0;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.loading-container {
  width: 100%;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.progress-bar-background {
  width: 100%;
  height: 2px;
  background-color: transparent;
  position: relative;
  display: flex;
  justify-content: space-between;
  overflow: hidden;
}

.progress-bar {
  height: 100%;
  background-color: #333;
  transition: width 0.3s ease-out;
  width: 0%;
}

.progress-bar.left {
  transform-origin: left;
  float: left;
}
.progress-bar.right {
  transform-origin: right;
  float: right;
}

.progress-percentage {
  position: absolute;
  color: #333;
  font-size: 18px;
  font-weight: bold;
  background-color: #e0e0e0;
  padding: 0 15px;
}
</style> 