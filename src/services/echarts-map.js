import * as echarts from 'echarts/core';
import { TitleComponent, TooltipComponent, GeoComponent } from 'echarts/components';
import { MapChart, ScatterChart } from 'echarts/charts';
import { CanvasRenderer } from 'echarts/renderers';

// 按需引入 ECharts 组件
echarts.use([
    TitleComponent,
    TooltipComponent,
    GeoComponent,
    MapChart,
    ScatterChart,
    CanvasRenderer
]);

/**
 * 生成 ECharts 地图的配置项
 * @returns {Promise<object>} 返回一个 Promise，解析为 ECharts 的 option 对象
 */
export async function getMapOptions() {
    try {
        // 1. 并行加载所有必需的数据
        const [chinaGeoJson, genresData] = await Promise.all([
            fetch('/china.json').then(res => res.json()),
            fetch('/data/genres.json').then(res => res.json())
        ]);

        const bandPromises = genresData.genres.map(genreId =>
            fetch(`/data/${genreId}/bands.json`).then(res => res.json()).then(bands =>
                bands.map(band => ({ ...band, genre: genreId }))
            )
        );
        const bandsByGenre = await Promise.all(bandPromises);
        const allBands = bandsByGenre.flat();

        // 2. 向 ECharts 注册地图数据
        echarts.registerMap('china', chinaGeoJson);

        // 3. 处理乐队数据，转换为 ECharts 散点图需要的数据格式
        const findProvinceCenter = (provinceName) => {
            const feature = chinaGeoJson.features.find(f => f.properties.name === provinceName);
            return feature ? feature.properties.center : null;
        };

        const bandData = allBands.map(band => {
            const provinceName = band.province.replace(/省|市|自治区|特别行政区|壮族|回族|维吾尔/g, '');
            const center = findProvinceCenter(provinceName);
            if (!center) return null;
            return {
                name: band.name,
                value: [...center, 1], // [经度, 纬度, 可选值]
                originalData: band // 保存原始数据，用于点击事件回调
            };
        }).filter(Boolean); // 过滤掉无法找到中心点的乐队

        // 4. 返回最终的 ECharts 配置对象
        return {
            backgroundColor: '#f9f9f9',
            geo: {
                map: 'china',
                roam: true, // 开启鼠标缩放和平移
                itemStyle: {
                    areaColor: '#ffffff',
                    borderColor: '#666',
                    borderWidth: 0.8
                },
                emphasis: {
                    focus: 'self',
                    itemStyle: {
                        areaColor: '#e0e0e0'
                    }
                },
                select: {
                    disabled: true
                },
                label: {
                    show: true,
                    color: '#444',
                    fontFamily: '"Songti SC", "STSong", "NSimSun", serif',
                    fontSize: 12
                }
            },
            series: [
                {
                    name: '乐队',
                    type: 'scatter',
                    coordinateSystem: 'geo',
                    data: bandData,
                    symbolSize: 8,
                    itemStyle: {
                        color: 'rgba(128, 0, 128, 0.7)',
                        borderColor: 'rgba(255, 255, 255, 0.5)',
                        borderWidth: 1
                    },
                    label: {
                        show: true,
                        formatter: '{b}', // {b} 代表数据项的 name
                        position: 'top',
                        color: '#111',
                        backgroundColor: 'rgba(255, 255, 255, 0.7)',
                        padding: [3, 5],
                        borderRadius: 3,
                        fontSize: 11,
                    },
                    emphasis: {
                        scale: true,
                        label: {
                            fontSize: 14
                        }
                    },
                    tooltip: {
                         show: false // 点击事件由组件层处理，禁用默认 tooltip
                    }
                }
            ]
        };

    } catch (error) {
        console.error("生成 ECharts 地图配置失败:", error);
        return {}; // 失败时返回空配置，防止应用崩溃
    }
}