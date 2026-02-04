'use client';

import { useEffect, useRef, useState } from 'react';
import * as echarts from 'echarts';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import { useMapStore } from '@/lib/store';
import { GENRE_COLORS } from '@/lib/constants';
import type { EChartsOption } from 'echarts';

export function ChinaMap() {
  const chartRef = useRef<ReactEChartsCore>(null);
  const { bands, selectProvince, selectedProvince } = useMapStore();
  const [mapLoaded, setMapLoaded] = useState(false);

  const getOption = (): EChartsOption => {
    // 计算省份中心坐标（如果选中了省份）
    let geoCenter: [number, number] | undefined = undefined;
    let geoZoom = 1.2;

    if (selectedProvince) {
      const provinceBands = bands.filter(band => band.province === selectedProvince);
      if (provinceBands.length > 0) {
        const avgLng = provinceBands.reduce((sum, b) => sum + (b.coordinates?.[0] || 0), 0) / provinceBands.length;
        const avgLat = provinceBands.reduce((sum, b) => sum + (b.coordinates?.[1] || 0), 0) / provinceBands.length;
        geoCenter = [avgLng, avgLat];
        geoZoom = 4;
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
        itemStyle: {
          areaColor: '#e8e8e8',
          borderColor: '#999',
          borderWidth: 0.5,
        },
        emphasis: {
          itemStyle: {
            areaColor: '#d0d0d0',
            borderWidth: 1,
            borderColor: '#666',
          },
          label: {
            show: true,
            fontSize: 14,
            color: '#333',
          },
        },
      },
      animationDuration: 800,
      animationEasing: 'cubicInOut',
    series: [
      // 引线（只在选中省份时显示）
      ...(selectedProvince ? [{
        name: '引线',
        type: 'lines',
        coordinateSystem: 'geo',
        data: bands
          .filter(band => band.province === selectedProvince)
          .map((band) => {
            const coords = band.coordinates || [0, 0];
            const provinceBands = bands.filter(b => b.province === selectedProvince);
            const avgLng = provinceBands.reduce((sum, b) => sum + ((b.coordinates?.[0] || 0)), 0) / provinceBands.length;
            const avgLat = provinceBands.reduce((sum, b) => sum + ((b.coordinates?.[1] || 0)), 0) / provinceBands.length;

            return {
              coords: [
                [avgLng, avgLat], // 省份中心
                coords,           // 乐队位置
              ],
            };
          }),
        lineStyle: {
          color: '#94a3b8',
          width: 1,
          type: 'dashed',
          opacity: 0.6,
        },
        effect: {
          show: false,
        },
        zlevel: 1,
      }] : []),
      // 乐队标记
      {
        name: '乐队',
        type: 'scatter',
        coordinateSystem: 'geo',
        data: bands.map((band) => ({
          name: band.name,
          value: band.coordinates,
          band: band,
          itemStyle: {
            color: GENRE_COLORS[band.genre] || '#94a3b8',
          },
        })),
        symbolSize: 32,
        symbol: (value: any, params: any) => {
          const band = params.data.band;
          // 如果有头像，使用头像；否则使用首字母
          if (band.avatar) {
            return `image://${band.avatar}`;
          } else {
            // 使用首字母，需要创建一个圆形背景
            return 'circle';
          }
        },
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
            shadowBlur: 10,
            shadowColor: 'rgba(0, 0, 0, 0.3)',
          },
          scale: 1.3,
        },
        zlevel: 2,
      },
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
    if (params.componentSubType === 'scatter') {
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
