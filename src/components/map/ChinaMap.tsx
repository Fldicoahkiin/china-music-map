'use client';

import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import { useMapStore } from '@/store/useMapStore';
import { useThemeStore } from '@/store/useThemeStore';

export default function ChinaMap() {
  const chartRef = useRef<HTMLDivElement>(null);
  const chartInstance = useRef<echarts.ECharts | null>(null);
  const { setSelectedProvince, setHoveredProvince } = useMapStore();
  const { currentGenre } = useThemeStore();

  useEffect(() => {
    if (!chartRef.current) return;

    chartInstance.current = echarts.init(chartRef.current);

    const option: echarts.EChartsOption = {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'item',
        backgroundColor: 'rgba(0,0,0,0.8)',
        borderColor: currentGenre.accentColor,
        textStyle: { color: '#fff' },
      },
      geo: {
        map: 'china',
        roam: true,
        zoom: 1.2,
        label: {
          show: true,
          color: '#fff',
        },
        itemStyle: {
          areaColor: currentGenre.primaryColor,
          borderColor: currentGenre.accentColor,
          borderWidth: 1,
        },
        emphasis: {
          label: {
            show: true,
            color: '#fff',
            fontSize: 16,
          },
          itemStyle: {
            areaColor: currentGenre.accentColor,
            shadowBlur: 10,
            shadowColor: currentGenre.primaryColor,
          },
        },
        select: {
          itemStyle: {
            areaColor: currentGenre.secondaryColor,
          },
        },
      },
    };

    chartInstance.current.setOption(option);

    chartInstance.current.on('click', (params) => {
      if (params.name) {
        setSelectedProvince(params.name);
      }
    });

    chartInstance.current.on('mouseover', (params) => {
      if (params.name) {
        setHoveredProvince(params.name);
      }
    });

    chartInstance.current.on('mouseout', () => {
      setHoveredProvince(null);
    });

    const handleResize = () => {
      chartInstance.current?.resize();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      chartInstance.current?.dispose();
    };
  }, [currentGenre, setSelectedProvince, setHoveredProvince]);

  return <div ref={chartRef} className="w-full h-full" />;
}
