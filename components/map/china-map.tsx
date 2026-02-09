'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import * as echarts from 'echarts';
import ReactEChartsCore from 'echarts-for-react/lib/core';
import { useMapStore } from '@/lib/store';
import { PROVINCE_CENTERS } from '@/lib/constants';
import {
  calculateForceLayout,
  getAvatarSizeForZoom,
  type ForceLayoutBand,
} from '@/lib/force-layout';
import { createGeoPixelConverter } from '@/lib/geo-pixel-converter';
import type { EChartsOption } from 'echarts';
import { useTheme } from 'next-themes';

export function ChinaMap() {
  const chartRef = useRef<ReactEChartsCore>(null);
  const {
    bands,
    selectProvince,
    selectedProvince,
    setSelectedBand,
    selectedGenre,
    genreFilteredBands,
  } = useMapStore();
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  // 布局数据状态
  const [layoutData, setLayoutData] = useState<ForceLayoutBand[]>([]);
  const [currentZoom, setCurrentZoom] = useState(1.2);

  // 保存当前缩放状态
  const zoomRef = useRef(1.2);
  const prevProvinceRef = useRef<string | null>(null);
  const layoutTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 防止 hydration 错误
  useEffect(() => {
    setMounted(true);
  }, []);

  const isDark = mounted ? resolvedTheme === 'dark' : false;

  // 根据流派过滤显示的乐队
  const displayBands = useMemo(() => {
    return selectedGenre ? genreFilteredBands : bands;
  }, [bands, selectedGenre, genreFilteredBands]);

  const isProvinceView = !!selectedProvince;

  // 计算布局（防抖处理）
  const recalculateLayout = useCallback(() => {
    if (!mapLoaded || displayBands.length === 0) return;

    const instance = chartRef.current?.getEchartsInstance();
    if (!instance) return;

    const converter = createGeoPixelConverter(instance);
    if (!converter) return;

    const zoom = converter.getZoom();
    const newLayout = calculateForceLayout(displayBands, converter, { zoom });
    setLayoutData(newLayout);
    setCurrentZoom(zoom);
  }, [mapLoaded, displayBands]);

  // 监听地图加载完成后初始化布局
  useEffect(() => {
    if (mapLoaded && displayBands.length > 0) {
      // 延迟执行，确保 ECharts 完全渲染
      const timer = setTimeout(recalculateLayout, 100);
      return () => clearTimeout(timer);
    }
  }, [mapLoaded, displayBands, recalculateLayout]);

  // 计算地图中心
  const mapCenter = useMemo((): [number, number] | undefined => {
    if (!selectedProvince) return undefined;
    const center = PROVINCE_CENTERS[selectedProvince];
    if (!center) return undefined;
    return [center[0] + 5, center[1]];
  }, [selectedProvince]);

  // 获取所有有乐队的省份
  const provincesWithBands = useMemo(() => {
    return [...new Set(displayBands.map((b) => b.province))];
  }, [displayBands]);

  const avatarBorderColor = isDark ? '#6b6560' : '#a09080';

  const colors = useMemo(
    () => ({
      mapBg: isDark ? '#1a1816' : '#f5f2ef',
      province: isDark ? '#2a2623' : '#e8e4df',
      provinceHover: isDark ? '#3a3633' : '#ddd8d2',
      provinceSelected: isDark ? '#4a4540' : '#d5cfc8',
      border: isDark ? '#3a3633' : '#ccc7c0',
      borderLight: isDark ? '#4a4643' : '#d8d4cd',
      text: isDark ? '#a09890' : '#5a5550',
      avatarBg: isDark ? '#3a3633' : '#4a4540',
      lineColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
    }),
    [isDark]
  );

  // 动态头像大小
  const avatarSize = useMemo(() => {
    const baseSize = getAvatarSizeForZoom(currentZoom);
    return isProvinceView ? baseSize * 1.1 : baseSize;
  }, [currentZoom, isProvinceView]);

  // 生成连接线数据（从省中心到乐队）
  const connectionLines = useMemo(() => {
    if (!selectedProvince) return [];

    const provinceBands = layoutData.filter(
      (b) => b.province === selectedProvince
    );
    const center = PROVINCE_CENTERS[selectedProvince];

    if (!center) return [];

    return provinceBands.map((band) => ({
      coords: [center, band.layoutPosition],
      band: band,
    }));
  }, [layoutData, selectedProvince]);

  const chartOption = useMemo((): EChartsOption => {
    // 只在省份切换时重置缩放
    const provinceChanged = selectedProvince !== prevProvinceRef.current;
    if (provinceChanged) {
      prevProvinceRef.current = selectedProvince;
      zoomRef.current = isProvinceView ? 5 : 1.2;
    }

    const provinceRegions = provincesWithBands.map((province) => ({
      name: province,
      itemStyle: {
        areaColor:
          isProvinceView && province !== selectedProvince
            ? isDark
              ? '#1f1d1a'
              : '#f0ece8'
            : colors.province,
        borderColor:
          isProvinceView && province !== selectedProvince
            ? colors.borderLight
            : colors.border,
      },
      emphasis:
        isProvinceView && province !== selectedProvince
          ? { disabled: true }
          : undefined,
    }));

    return {
      backgroundColor: 'transparent',
      tooltip: { show: false },
      geo: {
        map: 'china',
        roam: true,
        center: mapCenter,
        zoom: zoomRef.current,
        scaleLimit: { min: 0.8, max: 12 },
        itemStyle: {
          areaColor: colors.province,
          borderColor: colors.border,
          borderWidth: 0.8,
        },
        regions: provinceRegions,
        emphasis: {
          itemStyle: {
            areaColor: colors.provinceHover,
            borderColor: colors.border,
            borderWidth: 1.2,
          },
          label: {
            show: true,
            fontSize: 12,
            color: colors.text,
            fontWeight: 500,
          },
        },
        select: {
          itemStyle: {
            areaColor: colors.provinceSelected,
            borderColor: isDark ? '#5a5550' : '#b5b0a8',
            borderWidth: 1.5,
          },
          label: {
            show: true,
            fontSize: 13,
            color: colors.text,
            fontWeight: 600,
          },
        },
      },
      animation: false,
      series: [
        // 连接线 - 从省中心到乐队
        ...(isProvinceView && connectionLines.length > 0
          ? [
              {
                name: 'connections',
                type: 'lines' as const,
                coordinateSystem: 'geo' as const,
                zlevel: 1,
                effect: {
                  show: false,
                },
                lineStyle: {
                  color: colors.lineColor,
                  width: 1,
                  type: 'dashed' as const,
                  opacity: 0.6,
                },
                data: connectionLines.map((line) => ({
                  coords: line.coords,
                })),
              },
            ]
          : []),
        // 乐队头像
        {
          name: 'bands',
          type: 'scatter',
          coordinateSystem: 'geo',
          data: layoutData.map((band) => ({
            name: band.name,
            value: band.layoutPosition,
            band: band,
          })),
          symbolSize: avatarSize,
          symbol: (_value: unknown, params: unknown) => {
            const p = params as { data?: { band?: ForceLayoutBand } };
            const band = p.data?.band;
            return band?.avatar ? `image://${band.avatar}` : 'circle';
          },
          itemStyle: {
            color: colors.avatarBg,
            borderWidth: isProvinceView ? 3 : 2,
            borderColor: avatarBorderColor,
            shadowColor: 'rgba(0,0,0,0.15)',
            shadowBlur: isProvinceView ? 8 : 4,
            shadowOffsetY: isProvinceView ? 4 : 2,
          },
          label: {
            show: true,
            formatter: (params: unknown) => {
              const p = params as { data?: { band?: ForceLayoutBand } };
              const band = p.data?.band;
              return band?.avatar ? '' : band?.name?.[0] || '';
            },
            fontSize: avatarSize * 0.4,
            fontWeight: 600,
            color: '#fff',
          },
          emphasis: {
            scale: 1.15,
            itemStyle: {
              borderWidth: isProvinceView ? 4 : 3,
              shadowBlur: 12,
              shadowColor: 'rgba(0,0,0,0.2)',
            },
          },
          zlevel: 3,
        },
      ],
    };
  }, [
    selectedProvince,
    isProvinceView,
    layoutData,
    mapCenter,
    provincesWithBands,
    colors,
    isDark,
    avatarBorderColor,
    connectionLines,
    avatarSize,
  ]);

  useEffect(() => {
    const loadMap = async () => {
      try {
        const response = await fetch('/china.json', { cache: 'force-cache' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const geoJson = await response.json();
        echarts.registerMap('china', geoJson);
        setMapLoaded(true);
      } catch (error) {
        console.error('Failed to load map:', error);
      }
    };
    loadMap();
  }, []);

  const onChartClick = useCallback(
    (params: unknown) => {
      const p = params as {
        componentSubType?: string;
        seriesName?: string;
        data?: { band?: ForceLayoutBand };
        componentType?: string;
        name?: string;
      };

      if (p.componentSubType === 'scatter' && p.seriesName === 'bands') {
        const band = p.data?.band;
        if (band) {
          if (selectedProvince === band.province) {
            setSelectedBand(band);
          } else {
            selectProvince(band.province);
          }
        }
      } else if (p.componentType === 'geo') {
        const provinceName = p.name;
        if (provinceName === selectedProvince) {
          selectProvince(null);
        } else if (provinceName && provincesWithBands.includes(provinceName)) {
          selectProvince(provinceName);
        }
      }
    },
    [selectProvince, selectedProvince, setSelectedBand, provincesWithBands]
  );

  const chartEvents = useMemo(
    () => ({
      click: onChartClick,
      georoam: () => {
        // 保存 zoom 状态并触发布局重算
        if (chartRef.current) {
          const instance = chartRef.current.getEchartsInstance();
          const option = instance.getOption() as { geo?: Array<{ zoom?: number }> };
          const newZoom = option?.geo?.[0]?.zoom;
          if (typeof newZoom === 'number') {
            zoomRef.current = newZoom;

            // 防抖：zoom 变化时延迟重算布局
            if (layoutTimeoutRef.current) {
              clearTimeout(layoutTimeoutRef.current);
            }
            layoutTimeoutRef.current = setTimeout(() => {
              recalculateLayout();
            }, 150);
          }
        }
        window.dispatchEvent(new CustomEvent('mapZoomChanged'));
      },
    }),
    [onChartClick, recalculateLayout]
  );

  // 暴露缩放方法给外部组件
  useEffect(() => {
    if (!mapLoaded) return;

    const w = window as {
      __mapZoom?: (delta: number) => void;
      __mapSetZoom?: (zoom: number) => void;
      __mapGetZoom?: () => number;
      __mapReset?: () => void;
    };

    w.__mapZoom = (delta: number) => {
      const instance = chartRef.current?.getEchartsInstance();
      if (!instance) return;
      try {
        const option = instance.getOption() as { geo?: Array<{ zoom?: number }> };
        const currentZoom = option?.geo?.[0]?.zoom || 1.2;
        const newZoom = Math.max(0.8, Math.min(12, currentZoom + delta));
        instance.setOption({ geo: { zoom: newZoom } });
        zoomRef.current = newZoom;

        // 触发布局重算
        if (layoutTimeoutRef.current) {
          clearTimeout(layoutTimeoutRef.current);
        }
        layoutTimeoutRef.current = setTimeout(recalculateLayout, 150);

        window.dispatchEvent(new CustomEvent('mapZoomChanged'));
      } catch (e) {
        console.warn('Map zoom error:', e);
      }
    };

    w.__mapSetZoom = (newZoom: number) => {
      const instance = chartRef.current?.getEchartsInstance();
      if (!instance) return;
      try {
        const clampedZoom = Math.max(0.8, Math.min(12, newZoom));
        instance.setOption({ geo: { zoom: clampedZoom } });
        zoomRef.current = clampedZoom;

        if (layoutTimeoutRef.current) {
          clearTimeout(layoutTimeoutRef.current);
        }
        layoutTimeoutRef.current = setTimeout(recalculateLayout, 150);

        window.dispatchEvent(new CustomEvent('mapZoomChanged'));
      } catch (e) {
        console.warn('Map setZoom error:', e);
      }
    };

    w.__mapGetZoom = () => {
      const instance = chartRef.current?.getEchartsInstance();
      if (!instance) return 1.2;
      try {
        const option = instance.getOption() as { geo?: Array<{ zoom?: number }> };
        return option?.geo?.[0]?.zoom || 1.2;
      } catch {
        return 1.2;
      }
    };

    w.__mapReset = () => {
      const instance = chartRef.current?.getEchartsInstance();
      if (!instance) return;
      try {
        instance.setOption({ geo: { center: undefined, zoom: 1.2 } });
        zoomRef.current = 1.2;
        selectProvince(null);

        if (layoutTimeoutRef.current) {
          clearTimeout(layoutTimeoutRef.current);
        }
        layoutTimeoutRef.current = setTimeout(recalculateLayout, 150);

        window.dispatchEvent(new CustomEvent('mapZoomChanged'));
      } catch (e) {
        console.warn('Map reset error:', e);
      }
    };

    return () => {
      delete w.__mapZoom;
      delete w.__mapSetZoom;
      delete w.__mapGetZoom;
      delete w.__mapReset;
      if (layoutTimeoutRef.current) {
        clearTimeout(layoutTimeoutRef.current);
      }
    };
  }, [mapLoaded, selectProvince, recalculateLayout]);

  if (!mapLoaded) {
    return (
      <div
        className="w-full h-full flex items-center justify-center"
        style={{ backgroundColor: colors.mapBg }}
      >
        <div className="w-5 h-5 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div
      className="relative w-full h-full"
      style={{ backgroundColor: colors.mapBg }}
    >
      <ReactEChartsCore
        ref={chartRef}
        echarts={echarts}
        option={chartOption}
        style={{ height: '100%', width: '100%' }}
        onEvents={chartEvents}
        notMerge={true}
        lazyUpdate={true}
      />
    </div>
  );
}
