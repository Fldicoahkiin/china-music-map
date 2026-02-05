'use client';

import { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import { useMapStore } from '@/lib/store';
import { GENRE_COLORS, PROVINCE_CENTERS } from '@/lib/constants';
import { getBandsWithRadialPositions } from '@/lib/radial-layout';
import type { EChartsOption } from 'echarts';

export function ChinaMap() {
  const chartRef = useRef<ReactEChartsCore>(null);
  const { bands, selectProvince, selectedProvince } = useMapStore();
  const [mapLoaded, setMapLoaded] = useState(false);

  const getOption = (): EChartsOption => {
    // 计算省份中心坐标和乐队辐射位置
    let geoCenter: [number, number] | undefined = undefined;
    let geoZoom = 1.2;
    let radialBands: any[] = [];

    if (selectedProvince) {
      const provinceBands = bands.filter(band => band.province === selectedProvince);

      if (provinceBands.length > 0) {
        // 使用省份中心坐标（如果有的话），否则使用平均坐标
        geoCenter = PROVINCE_CENTERS[selectedProvince] || [
          provinceBands.reduce((sum, b) => sum + (b.coordinates?.[0] || 0), 0) / provinceBands.length,
          provinceBands.reduce((sum, b) => sum + (b.coordinates?.[1] || 0), 0) / provinceBands.length
        ];
        geoZoom = 5;

        // 计算辐射位置
        radialBands = getBandsWithRadialPositions(provinceBands, geoCenter);
      }
    }

    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        formatter: (params: any) => {
          if (params.componentSubType === 'scatter') {
            const band = params.data.band;
            return `${band.name}<br/>${band.genre} · ${band.city}`;
          } else {
            return params.name;
          }
        },
      },
      geo: {
        map: 'china',
        roam: true,
        center: geoCenter,
        zoom: geoZoom,
        scaleLimit: {
          min: 0.8,
          max: 10,
        },
        // 未选中状态的基础样式
        itemStyle: {
          areaColor: '#e5e7eb',
          borderColor: '#9ca3af',
          borderWidth: 1,
          shadowBlur: 3,
          shadowColor: 'rgba(0, 0, 0, 0.1)',
          shadowOffsetY: 2,
        },
        // 选中省份时，其他省份的样式（压低、暗淡）
        ...(selectedProvince ? {
          regions: bands
            .map(band => band.province)
            .filter((p, i, arr) => arr.indexOf(p) === i) // 去重
            .filter(p => p !== selectedProvince)
            .map(province => ({
              name: province,
              itemStyle: {
                areaColor: '#e2e8f0',
                borderColor: '#cbd5e1',
                opacity: 0.4,
              },
              emphasis: {
                disabled: true, // 禁用hover效果
              },
            })),
        } : {}),
        // Hover效果
        emphasis: {
          itemStyle: {
            areaColor: '#34d399',
            borderWidth: 2,
            borderColor: '#fff',
            shadowBlur: 20,
            shadowColor: 'rgba(52, 211, 153, 0.6)',
            shadowOffsetY: 8,
          },
          label: {
            show: true,
            fontSize: 16,
            color: '#1e293b',
            fontWeight: 'bold',
          },
        },
        // 选中状态
        select: {
          itemStyle: {
            areaColor: '#43e97b',
            borderWidth: 3,
            borderColor: '#fff',
            shadowBlur: 30,
            shadowColor: 'rgba(67, 233, 123, 0.8)',
            shadowOffsetY: 15,
          },
          label: {
            show: true,
            fontSize: 18,
            color: '#fff',
            fontWeight: 'bold',
          },
        },
      },
      animationDuration: 800,
      animationEasing: 'cubicInOut',
      series: [
        // 引线（渐变虚线，只在选中省份时显示）
        ...(selectedProvince && radialBands.length > 0 ? [{
          name: '引线',
          type: 'lines' as const,
          coordinateSystem: 'geo' as const,
          data: radialBands.map((band) => ({
            coords: [
              geoCenter!, // 省份中心
              band.radialPosition, // 辐射位置
            ],
          })),
          lineStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 1,
              y2: 0,
              colorStops: [
                { offset: 0, color: 'rgba(67, 233, 123, 0.8)' },
                { offset: 1, color: 'rgba(67, 233, 123, 0.2)' }
              ],
            },
            width: 2,
            type: 'dashed',
            curveness: 0.3,
            opacity: 0.8,
          },
          effect: {
            show: false,
          },
          zlevel: 1,
        }] : []),

        // 全国视图：显示所有乐队在真实位置
        ...(!selectedProvince ? [{
          name: '乐队',
          type: 'scatter' as const,
          coordinateSystem: 'geo' as const,
          data: bands.map((band) => ({
            name: band.name,
            value: band.coordinates,
            band: band,
            itemStyle: {
              color: GENRE_COLORS[band.genre] || '#94a3b8',
            },
          })),
          symbolSize: 28,
          symbol: 'circle',
          itemStyle: {
            borderWidth: 2,
            borderColor: '#fff',
          },
          label: {
            show: false,
          },
          emphasis: {
            itemStyle: {
              borderWidth: 3,
              shadowBlur: 15,
              shadowColor: 'rgba(20, 184, 166, 0.5)',
            },
            scale: 1.4,
          },
          zlevel: 2,
        }] : []),

        // 省份视图：显示辐射状乐队头像
        ...(selectedProvince && radialBands.length > 0 ? [{
          name: '乐队',
          type: 'scatter' as const,
          coordinateSystem: 'geo' as const,
          data: radialBands.map((band, index) => ({
            name: band.name,
            value: band.radialPosition,
            band: band,
            itemStyle: {
              color: GENRE_COLORS[band.genre] || '#94a3b8',
            },
            animationDelay: 600 + index * 100, // 依次弹出
          })),
          symbolSize: 64,
          symbol: (value: any, params: any) => {
            const band = params.data.band;
            if (band.avatar) {
              return `image://${band.avatar}`;
            }
            return 'circle';
          },
          itemStyle: {
            borderWidth: 3,
            borderColor: '#fff',
            shadowBlur: 8,
            shadowColor: 'rgba(20, 184, 166, 0.3)',
          },
          label: {
            show: false,
          },
          emphasis: {
            itemStyle: {
              borderWidth: 4,
              shadowBlur: 20,
              shadowColor: 'rgba(67, 233, 123, 0.6)',
            },
            scale: 1.3,
            label: {
              show: true,
              formatter: '{b}',
              position: 'top',
              color: '#fff',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              padding: [4, 8],
              borderRadius: 4,
              fontSize: 12,
            },
          },
          zlevel: 3,
        }] : []),

        // 省份中心标记（选中时显示）
        ...(selectedProvince && geoCenter ? [{
          name: '省份中心',
          type: 'scatter' as const,
          coordinateSystem: 'geo' as const,
          data: [{
            name: selectedProvince,
            value: geoCenter,
          }],
          symbolSize: 20,
          symbol: 'circle',
          itemStyle: {
            color: '#43e97b',
            borderWidth: 3,
            borderColor: '#fff',
            shadowBlur: 10,
            shadowColor: 'rgba(67, 233, 123, 0.6)',
          },
          label: {
            show: false,
          },
          zlevel: 2,
          silent: true, // 不响应鼠标事件
        }] : []),
      ],
    };
  };

  useEffect(() => {
    const loadMap = async () => {
      try {
        const response = await fetch('/china.json', {
          cache: 'no-cache',
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const geoJson = await response.json();
        echarts.registerMap('china', geoJson);
        setMapLoaded(true);

        const chartInstance = chartRef.current?.getEchartsInstance();
        if (chartInstance) {
          chartInstance.setOption(getOption());
        }
      } catch (error) {
        console.error('Failed to load China map:', error);
      }
    };

    loadMap();
  }, []);

  // 当乐队数据或选中省份变化时更新
  useEffect(() => {
    if (!mapLoaded) return;

    const chartInstance = chartRef.current?.getEchartsInstance();
    if (chartInstance) {
      chartInstance.setOption(getOption());
    }
  }, [bands, selectedProvince, mapLoaded]);

  const onChartClick = (params: any) => {
    if (params.componentSubType === 'scatter' && params.seriesName === '乐队') {
      const band = params.data.band;
      if (band) {
        selectProvince(band.province);
      }
    } else if (params.componentType === 'geo') {
      const provinceName = params.name;
      if (provinceName !== selectedProvince) {
        selectProvince(provinceName);
      } else {
        selectProvince(null);
      }
    }
  };

  if (!mapLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <p className="text-muted-foreground">加载地图中...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full">
      <ReactEChartsCore
        ref={chartRef}
        echarts={echarts}
        option={getOption()}
        style={{ height: '100%', width: '100%' }}
        onEvents={{
          click: onChartClick,
        }}
        notMerge={false}
        lazyUpdate={false}
      />
    </div>
  );
}
