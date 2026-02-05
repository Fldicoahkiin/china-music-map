/**
 * 辐射状布局算法
 * 计算乐队头像围绕省份中心的辐射位置
 */

import type { Band } from '@/types/band';

/**
 * 计算辐射位置的坐标
 * @param centerCoord 省份中心坐标 [lng, lat]
 * @param bandCount 乐队数量
 * @param radius 辐射半径（地图单位，约等于度数）
 */
export function calculateRadialPositions(
  centerCoord: [number, number],
  bandCount: number,
  radius: number = 3 // 3度约等于300km
): [number, number][] {
  const positions: [number, number][] = [];

  if (bandCount === 0) return positions;
  if (bandCount === 1) return [centerCoord]; // 单个乐队放在中心

  const angleStep = (2 * Math.PI) / bandCount;

  for (let i = 0; i < bandCount; i++) {
    const angle = angleStep * i - Math.PI / 2; // 从顶部(12点方向)开始

    // 计算经纬度偏移
    // 纬度1度 ≈ 111km，经度1度 = 111km * cos(lat)
    const lngOffset = radius * Math.cos(angle) / Math.cos(centerCoord[1] * Math.PI / 180);
    const latOffset = radius * Math.sin(angle);

    positions.push([
      centerCoord[0] + lngOffset,
      centerCoord[1] + latOffset
    ]);
  }

  return positions;
}

/**
 * 为选中省份的乐队生成辐射位置
 * @param bands 乐队数组
 * @param centerCoord 省份中心坐标
 */
export function getBandsWithRadialPositions(
  bands: Band[],
  centerCoord: [number, number]
): Array<Band & { radialPosition: [number, number] }> {
  const radialPositions = calculateRadialPositions(centerCoord, bands.length);

  return bands.map((band, index) => ({
    ...band,
    radialPosition: radialPositions[index]
  }));
}
