<template>
  <v-chart class="chart" :option="chartOption" autoresize @click="handleChartClick" />
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { MapChart, ScatterChart } from 'echarts/charts';
import { TitleComponent, TooltipComponent, GeoComponent } from 'echarts/components';
import VChart from 'vue-echarts';
import { getMapOptions } from '../services/echarts-map';

// 按需注册 ECharts 组件
use([
  CanvasRenderer,
  MapChart,
  ScatterChart,
  TitleComponent,
  TooltipComponent,
  GeoComponent,
]);

const chartOption = ref({});
const emit = defineEmits(['band-selected', 'progress', 'loaded']);

// 处理图表点击事件
const handleChartClick = (params) => {
    // 确保点击的是乐队散点
    if (params.seriesType === 'scatter' && params.data && params.data.originalData) {
        emit('band-selected', params.data.originalData);
    }
};

// 组件挂载后，异步获取地图配置并渲染
onMounted(async () => {
    emit('progress', 0);
    chartOption.value = await getMapOptions();
    emit('progress', 100);
    setTimeout(() => emit('loaded'), 300); // 延迟一小段时间以获得更好的视觉效果
});

</script>

<style scoped>
.chart {
  height: 100%;
  width: 100%;
}
</style>