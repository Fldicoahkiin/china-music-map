<template>
  <v-chart
    ref="chartRef"
    class="chart"
    :option="chartOption"
    autoresize
    @click="handleChartClick"
  />
</template>

<script setup>
import { ref, onMounted, nextTick } from 'vue';
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
const chinaGeoJson = ref(null);
const allBands = ref([]);
const chartRef = ref(null);
const currentSelection = ref({ type: null, name: null }); // 'province' or 'band'
const emit = defineEmits(['band-selected', 'progress', 'loaded']);

const zoomToProvince = (provinceName) => {
    const chart = chartRef.value?.chart;
    if (!chart) return;
    
    const provinceFeature = chinaGeoJson.value.features.find(f => f.properties.name === provinceName);
    if (!provinceFeature) return;

    let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
    const extractCoords = (coords) => {
        for (const path of coords) {
            if (typeof path[0] === 'number') {
                minLng = Math.min(minLng, path[0]);
                maxLng = Math.max(maxLng, path[0]);
                minLat = Math.min(minLat, path[1]);
                maxLat = Math.max(maxLat, path[1]);
            } else { extractCoords(path); }
        }
    };
    extractCoords(provinceFeature.geometry.coordinates);

    const centerLng = (minLng + maxLng) / 2;
    const centerLat = (minLat + maxLat) / 2;
    const bboxWidth = maxLng - minLng;
    const bboxHeight = maxLat - minLat;

    const containerWidth = chart.getWidth();
    const containerHeight = chart.getHeight();
    const targetWidth = containerWidth / 2;

    const zoomX = targetWidth / bboxWidth;
    const zoomY = containerHeight / bboxHeight;
    const zoom = Math.min(zoomX, zoomY) * 0.85; // 调整缩放系数以减少留白

    const centerOffset = (bboxWidth / zoom) / 4;
    const adjustedCenterLng = centerLng - centerOffset;

    chartOption.value.geo = {
        ...chartOption.value.geo,
        center: [adjustedCenterLng, centerLat],
        zoom: zoom,
    };
    currentSelection.value = { type: 'province', name: provinceName };
};

const panOrZoomToBand = async (bandCoords, targetZoom) => {
    const chart = chartRef.value?.chart;
    if (!chart) return;

    // 第一步: 设置缩放级别和临时中心点
    chartOption.value.geo = {
        ...chartOption.value.geo,
        center: bandCoords,
        zoom: targetZoom,
    };

    await nextTick(); // 等待 ECharts 更新完毕

    // 第二步: 基于新视口计算精确的中心点偏移
    const leftGeo = chart.convertFromPixel('geo', [0, 0]);
    const rightGeo = chart.convertFromPixel('geo', [chart.getWidth(), 0]);
    if (!leftGeo || !rightGeo) return; // 防御 ECharts 可能的转换失败

    const lngSpan = Math.abs(rightGeo[0] - leftGeo[0]);
    const lngOffset = lngSpan / 4; // 1/4 屏幕宽度对应的经度偏移
    const adjustedCenter = [bandCoords[0] - lngOffset, bandCoords[1]];

    // 第三步: 应用最终的、精确调整过的中心点
    chartOption.value.geo.center = adjustedCenter;
};


// 处理图表点击事件
const handleChartClick = async (params) => {
    const chart = chartRef.value?.chart;
    if (!chart) return;

    // 点击乐队
    if (params.seriesType === 'scatter' && params.data && params.data.originalData) {
        const band = params.data.originalData;
        const bandProvince = band.province.replace(/省|市|自治区|特别行政区|壮族|回族|维吾尔/g, '');
        const bandCoords = params.data.value.slice(0, 2);
        emit('band-selected', band);

        let targetZoom;
        if (currentSelection.value.type === 'province' && currentSelection.value.name.startsWith(bandProvince)) {
            // 省份已选中，仅平移，保持当前缩放级别
            targetZoom = chartOption.value.geo.zoom;
        } else {
            // 未选中或点击了其他省份的乐队，则放大
            targetZoom = 5;
        }
        
        await panOrZoomToBand(bandCoords, targetZoom);

        currentSelection.value = { type: 'band', name: band.name };
        chart.dispatchAction({ type: 'unselect', componentType: 'geo', name: currentSelection.value.name });
    
    // 点击省份
    } else if (params.componentType === 'geo') {
        const provinceName = params.name;
        chart.dispatchAction({ type: 'select', componentType: 'geo', name: provinceName });
        zoomToProvince(provinceName);
    }
};

const resetView = () => {
    const chart = chartRef.value?.chart;
    if (!chart) return;

    chart.dispatchAction({ type: 'unselect', componentType: 'geo', name: currentSelection.value.name });
    currentSelection.value = { type: null, name: null };
    
    chart.dispatchAction({ type: 'restore' });
};

defineExpose({
    resetView
});

// 组件挂载后，异步获取地图配置并渲染
onMounted(async () => {
    emit('progress', 0);
    const { options, chinaGeoJson: geoJson, allBands: bands } = await getMapOptions();
    chartOption.value = options;
    chinaGeoJson.value = geoJson;
    allBands.value = bands;
    emit('progress', 100);
    setTimeout(() => emit('loaded'), 300);
});

</script>

<style scoped>
.chart {
  height: 100%;
  width: 100%;
}
</style>