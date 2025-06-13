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

        // --- 第一步: 预计算每个省的乐队总数 ---
        const provinceBandCounters = allBands.reduce((acc, band) => {
            const provinceName = band.province.replace(/省|市|自治区|特别行政区|壮族|回族|维吾尔/g, '');
            acc[provinceName] = (acc[provinceName] || 0) + 1;
            return acc;
        }, {});
        const provinceBandIndexes = {}; // 用于在映射时跟踪当前省份乐队的索引

        const bandData = allBands.map(band => {
            const provinceName = band.province.replace(/省|市|自治区|特别行政区|壮族|回族|维吾尔/g, '');
            const center = findProvinceCenter(provinceName);
            if (!center) return null;

            // --- 第二步: 应用黄金角度螺旋分布算法 ---
            const totalBandsInProvince = provinceBandCounters[provinceName];
            const currentIndex = provinceBandIndexes[provinceName] || 0;
            provinceBandIndexes[provinceName] = currentIndex + 1;

            let distributedCenter = center;
            if (totalBandsInProvince > 1) {
                const angle = currentIndex * 137.5; // 黄金角度
                const radius = 0.5 * Math.sqrt(currentIndex + 0.5); // +0.5 避免第一个点在中心
                const lngOffset = radius * Math.cos(angle * Math.PI / 180);
                const latOffset = radius * Math.sin(angle * Math.PI / 180);
                distributedCenter = [center[0] + lngOffset, center[1] + latOffset];
            }
            // --- 算法结束 ---

            // 为 rich text 创建唯一的 key
            const richKey = `logo-${band.genre}-${band.logo}`.replace(/\./g, '_');
            const hasLogo = band.logo && band.logo !== "";

            return {
                name: band.name,
                value: [...distributedCenter, 1],
                originalData: band,
                hasLogo,
                label: {
                    rich: {
                        [richKey]: {
                            backgroundColor: {
                                image: `/data/${band.genre}/${band.logo}`
                            },
                            width: 24,
                            height: 24,
                        },
                        name: {
                            color: '#111',
                            align: 'center',
                            padding: hasLogo ? [30, 0, 0, 0] : [0, 0, 0, 0],
                            fontSize: 11,
                            fontFamily: '"Songti SC", "STSong", "NSimSun", serif'
                        }
                    }
                }
            };
        }).filter(Boolean);

        // 4. 返回最终的 ECharts 配置对象
        return {
            options: {
                backgroundColor: '#f9f9f9',
                geo: {
                    map: 'china',
                    roam: true,
                    itemStyle: {
                        areaColor: '#ffffff',
                        borderColor: '#666',
                        borderWidth: 0.8
                    },
                    emphasis: {
                        itemStyle: {
                            areaColor: '#e0e0e0',
                            borderColor: '#333',
                            borderWidth: 1
                        }
                    },
                    select: {
                        disabled: false,
                        itemStyle: {
                            areaColor: '#fdebb2',
                            borderColor: '#e6a23c',
                            shadowColor: 'rgba(0, 0, 0, 0.2)',
                            shadowBlur: 10,
                            shadowOffsetX: 2,
                            shadowOffsetY: 4
                        },
                        label: {
                           show: true,
                           color: '#333'
                        }
                    },
                    label: {
                        show: true, // 重新启用默认标签
                        color: '#444',
                        fontFamily: '"Songti SC", "STSong", "NSimSun", serif',
                        fontSize: 12
                    },
                    selectedMode: 'single'
                },
                series: [
                    {
                        name: '乐队',
                        type: 'scatter',
                        coordinateSystem: 'geo',
                        data: bandData,
                        symbolSize: 2, // 弱化锚点
                        itemStyle: {
                             color: 'rgba(0, 0, 0, 0.5)', // 中性、半透明的锚点颜色
                             borderColor: 'transparent'
                        },
                        label: {
                            show: true,
                            position: 'top',
                            formatter: (params) => {
                                if (params.data.hasLogo) {
                                    const richKey = `logo-${params.data.originalData.genre}-${params.data.originalData.logo}`.replace(/\./g, '_');
                                    return `{${richKey}|}\n{name|${params.name}}`;
                                }
                                return `{name|${params.name}}`;
                            },
                            backgroundColor: 'rgba(255, 255, 255, 0.7)',
                            padding: [4, 6],
                            borderRadius: 4,
                            labelLine: {
                                show: true,
                                length2: 5,
                                lineStyle: {
                                    color: '#888',
                                    width: 1,
                                    type: 'solid'
                                }
                            },
                        },
                        emphasis: {
                            scale: 1.2,
                        },
                        tooltip: {
                             show: false
                        }
                    }
                ]
            },
            chinaGeoJson,
            allBands
        };

    } catch (error) {
        console.error("生成 ECharts 地图配置失败:", error);
        return { options: {}, chinaGeoJson: null, allBands: [] };
    }
}