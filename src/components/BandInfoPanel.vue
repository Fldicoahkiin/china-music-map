<template>
  <div class="info-panel" :class="{ 'is-open': band }">
    <button v-if="band" @click="closePanel" class="close-btn">&times;</button>
    <div v-if="band" class="panel-content">
      <h2>{{ band.name }}</h2>
      <p><strong>省份:</strong> {{ band.province }}</p>
      <p><strong>流派:</strong> <span class="genre-tag">{{ band.genre }}</span></p>
      <div v-if="band.images && band.images.length > 0" class="images">
        <img v-for="image in band.images" :key="image" :src="image" :alt="band.name" />
      </div>
      <p>{{ band.description }}</p>
      <div class="links">
        <a v-if="band.links.bandcamp" :href="band.links.bandcamp" target="_blank">Bandcamp</a>
        <a v-if="band.links.soundcloud" :href="band.links.soundcloud" target="_blank">SoundCloud</a>
      </div>
    </div>
    <div v-else class="placeholder">
      <p>点击地图上的乐队 Logo 查看详情</p>
    </div>
  </div>
</template>

<script setup>
defineProps({
  band: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['close']);

const closePanel = () => {
  emit('close');
};
</script>

<style scoped>
.info-panel {
  position: fixed;
  top: 0;
  right: -350px; /* 默认隐藏 */
  width: 350px;
  height: 100vh;
  background-color: rgba(255, 255, 255, 0.9);
  box-shadow: -2px 0 5px rgba(0,0,0,0.1);
  padding: 20px;
  transition: right 0.3s ease-in-out;
  overflow-y: auto;
  color: #333;
  z-index: 1001; /* 高于地图和标题 */
}

.info-panel.is-open {
  right: 0; /* 滑入 */
}

.close-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
}

.panel-content h2 {
  margin-top: 0;
}

.genre-tag {
  background-color: #333;
  color: #fff;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 12px;
  text-transform: capitalize;
}

.images img {
  width: 100%;
  margin-bottom: 10px;
  border-radius: 4px;
}

.links a {
  margin-right: 10px;
  color: #007bff;
  text-decoration: none;
}

.links a:hover {
  text-decoration: underline;
}

.placeholder {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    color: #888;
}
</style> 