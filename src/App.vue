<template>
  <div id="app-container">
    <LoadingScreen v-if="isLoading" :progress="loadingProgress" />
    <div class="main-content" :class="{ 'is-hidden': isLoading }">
      <h1 class="app-title">中国Shoegaze地图</h1>
      <MapContainer 
        ref="mapContainer"
        @band-selected="handleBandSelected" 
        @progress="updateProgress"
        @loaded="finishLoading"
      />
      <BandInfoPanel 
        :band="selectedBand" 
        @close="closePanel"
      />
      <button 
        @click="resetView" 
        class="reset-view-btn">
        重置视角
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import MapContainer from './components/MapContainer.vue';
import BandInfoPanel from './components/BandInfoPanel.vue';
import LoadingScreen from './components/LoadingScreen.vue';

const mapContainer = ref(null);
const selectedBand = ref(null);
const isLoading = ref(true);
const loadingProgress = ref(0);

const handleBandSelected = (band) => {
  selectedBand.value = band;
};

const closePanel = () => {
  selectedBand.value = null;
};

const resetView = () => {
  if (mapContainer.value) {
    mapContainer.value.resetView();
  }
  closePanel();
};

const updateProgress = (progress) => {
  loadingProgress.value = progress;
};

const finishLoading = () => {
  // Final progress update to 100%
  loadingProgress.value = 100;
  setTimeout(() => {
    isLoading.value = false;
  }, 500); // Wait for animation to finish
};
</script>

<style>
html, body, #app {
  margin: 0;
  padding: 0;
  overflow: hidden; /* 防止出现滚动条 */
  width: 100%;
  height: 100%;
  background-color: #e0e0e0;
}

#app {
  max-width: none; /* 覆盖默认的宽度限制 */
  padding: 0; /* 移除内边距 */
  text-align: left; /* 恢复默认对齐 */
}

.map-area {
  width: 100%;
  height: 100vh;
}

#app-container {
  position: relative;
  width: 100vw;
  height: 100vh;
}

.reset-view-btn {
  position: fixed;
  bottom: 20px;
  left: 20px;
  padding: 10px 15px;
  background-color: #f0f0f0;
  color: #333;
  border: 1px solid #ccc;
  border-radius: 5px;
  cursor: pointer;
  z-index: 1000;
}

.reset-view-btn:hover {
  background-color: #e0e0e0;
}

.main-content {
  width: 100%;
  height: 100%;
  opacity: 1;
  visibility: visible;
  transition: opacity 0.5s ease-in;
}

.main-content.is-hidden {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
}

.app-title {
  position: absolute;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  font-family: 'Yozai', cursive;
  font-size: 48px;
  color: #333;
  z-index: 100;
  pointer-events: none; /* 让鼠标事件穿透标题 */
  text-shadow: 1px 1px 2px rgba(0,0,0,0.1);
}
</style>
 