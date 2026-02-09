import {
  forceSimulation,
  forceCollide,
  forceRadial,
  forceX,
  forceY,
  type SimulationNodeDatum,
} from 'd3-force';
import type { Band } from '@/types/band';
import { PROVINCE_CENTERS } from './constants';
import type { GeoPixelConverter } from './geo-pixel-converter';

export interface ForceLayoutBand extends Band, SimulationNodeDatum {
  x: number;
  y: number;
  layoutPosition: [number, number];
  provinceCenter: [number, number];
  provinceCenterPixel: [number, number];
}

export interface ForceLayoutConfig {
  zoom: number;
  baseAvatarSize: number;
  minGap: number;
  iterations: number;
}

const DEFAULT_CONFIG: ForceLayoutConfig = {
  zoom: 1.2,
  baseAvatarSize: 32,
  minGap: 2,
  iterations: 120,
};

function getZoomBasedParams(zoom: number) {
  const t = Math.min(1, Math.max(0, (zoom - 1) / (10 - 1)));
  return {
    avatarSize: 32 + t * 12,
    centerStrength: 0.3 + t * 0.7,
    collideRadiusMultiplier: 1.0,
  };
}

function groupByProvince(bands: Band[]): Map<string, Band[]> {
  const groups = new Map<string, Band[]>();
  bands.forEach((band) => {
    const list = groups.get(band.province) || [];
    list.push(band);
    groups.set(band.province, list);
  });
  return groups;
}

function layoutProvinceCluster(
  bands: Band[],
  provinceCenter: [number, number],
  converter: GeoPixelConverter,
  config: ForceLayoutConfig
): ForceLayoutBand[] {
  if (bands.length === 0) return [];

  const params = getZoomBasedParams(config.zoom);
  const provinceCenterPixel = converter.geoToPixel(provinceCenter);

  const nodes: ForceLayoutBand[] = bands.map((band, i) => {
    const angle = i * Math.PI * (3 - Math.sqrt(5));
    return {
      ...band,
      x: provinceCenterPixel[0] + Math.cos(angle),
      y: provinceCenterPixel[1] + Math.sin(angle),
      layoutPosition: provinceCenter,
      provinceCenter,
      provinceCenterPixel,
    };
  });

  if (nodes.length === 1) {
    nodes[0].layoutPosition = provinceCenter;
    return nodes;
  }

  const collideRadius = (params.avatarSize / 2) + config.minGap;

  const simulation = forceSimulation(nodes)
    .force(
      'collide',
      forceCollide<ForceLayoutBand>()
        .radius(collideRadius)
        .strength(1.0)
        .iterations(4)
    )
    .force(
      'radial',
      forceRadial<ForceLayoutBand>(0, provinceCenterPixel[0], provinceCenterPixel[1])
        .strength(params.centerStrength)
    )
    .force('centerX', forceX(provinceCenterPixel[0]).strength(params.centerStrength * 0.3))
    .force('centerY', forceY(provinceCenterPixel[1]).strength(params.centerStrength * 0.3))
    .stop();

  for (let i = 0; i < config.iterations; i++) simulation.tick();

  nodes.forEach((node) => {
    node.layoutPosition = converter.pixelToGeo([node.x, node.y]);
  });

  return nodes;
}

export function calculateForceLayout(
  bands: Band[],
  converter: GeoPixelConverter,
  config: Partial<ForceLayoutConfig> = {}
): ForceLayoutBand[] {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };
  const provinceGroups = groupByProvince(bands);
  const result: ForceLayoutBand[] = [];

  provinceGroups.forEach((provinceBands, province) => {
    const center = PROVINCE_CENTERS[province];
    if (!center) {
      provinceBands.forEach((band) => {
        const coord = (band.coordinates as [number, number]) || [116, 39];
        result.push({
          ...band,
          x: 0,
          y: 0,
          layoutPosition: coord,
          provinceCenter: coord,
          provinceCenterPixel: [0, 0],
        } as ForceLayoutBand);
      });
      return;
    }
    result.push(...layoutProvinceCluster(provinceBands, center, converter, finalConfig));
  });

  return result;
}

export function getAvatarSizeForZoom(zoom: number): number {
  return getZoomBasedParams(zoom).avatarSize;
}
