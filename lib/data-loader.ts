import type { Band, Genre } from '@/types/band';
import { CITY_CENTERS, PROVINCE_CENTERS } from './constants';

/**
 * 根据城市名获取坐标
 */
export function getCityCoordinates(city: string, province: string): [number, number] {
  // 优先使用城市坐标
  if (CITY_CENTERS[city]) {
    return CITY_CENTERS[city];
  }

  // 如果没有城市坐标，使用省份坐标
  if (PROVINCE_CENTERS[province]) {
    return PROVINCE_CENTERS[province];
  }

  // 默认返回北京坐标
  console.warn(`未找到城市 "${city}" 或省份 "${province}" 的坐标，使用默认坐标`);
  return [116.407, 39.904];
}

/**
 * 加载流派数据
 */
export async function loadGenres(): Promise<Genre[]> {
  try {
    const response = await fetch('/data/genres.json');
    const data = await response.json();
    return data.genres || [];
  } catch (error) {
    console.error('Failed to load genres:', error);
    return [];
  }
}

/**
 * 加载所有乐队数据
 */
export async function loadAllBands(): Promise<Band[]> {
  try {
    const genres = await loadGenres();
    const allBands: Band[] = [];

    // 并行加载所有流派的乐队数据
    const bandPromises = genres.map(async (genre) => {
      try {
        const response = await fetch(`/data/${genre.id}/bands.json`);
        const bands = await response.json();
        return bands;
      } catch (error) {
        console.error(`Failed to load bands for genre ${genre.id}:`, error);
        return [];
      }
    });

    const bandArrays = await Promise.all(bandPromises);
    bandArrays.forEach((bands) => allBands.push(...bands));

    // 自动填充缺失的坐标
    allBands.forEach((band) => {
      if (!band.coordinates) {
        band.coordinates = getCityCoordinates(band.city, band.province);
      }
    });

    return allBands;
  } catch (error) {
    console.error('Failed to load all bands:', error);
    return [];
  }
}

/**
 * 按省份统计乐队数量
 */
export function getBandCountByProvince(bands: Band[]): Record<string, number> {
  const counts: Record<string, number> = {};

  bands.forEach((band) => {
    const province = band.province;
    counts[province] = (counts[province] || 0) + 1;
  });

  return counts;
}
