/**
 * 地理坐标与像素坐标转换工具
 * 用于在 ECharts geo 坐标系和屏幕像素之间转换
 */

import type * as echarts from 'echarts';

export interface GeoPixelConverter {
  geoToPixel: (coord: [number, number]) => [number, number];
  pixelToGeo: (pixel: [number, number]) => [number, number];
  getZoom: () => number;
}

/**
 * 从 ECharts 实例创建坐标转换器
 */
export function createGeoPixelConverter(
  echartsInstance: echarts.ECharts
): GeoPixelConverter | null {
  try {
    return {
      geoToPixel: (coord: [number, number]): [number, number] => {
        const pixel = echartsInstance.convertToPixel('geo', coord);
        return [pixel[0], pixel[1]];
      },
      pixelToGeo: (pixel: [number, number]): [number, number] => {
        const geoCoord = echartsInstance.convertFromPixel('geo', pixel);
        return [geoCoord[0], geoCoord[1]];
      },
      getZoom: (): number => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const option = echartsInstance.getOption() as any;
        return option?.geo?.[0]?.zoom || 1.2;
      },
    };
  } catch (e) {
    console.warn('Failed to create geo-pixel converter:', e);
    return null;
  }
}
