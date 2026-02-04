/**
 * 乐队数据类型定义
 */
export interface Band {
  id: string;
  name: string;
  avatar?: string;
  genre: string;
  province: string;
  city: string;
  coordinates?: [number, number]; // [lng, lat] - 可选，会根据city自动获取
  foundedYear?: number;
  description?: string;
  albums?: string[];
  links?: BandLinks;
}

export interface BandLinks {
  netease?: string;
  douban?: string;
  spotify?: string;
  bandcamp?: string;
  bilibili?: string;
}

/**
 * 流派数据类型
 */
export interface Genre {
  id: string;
  name: string;
  nameEn: string;
  color: string;
  description?: string;
}

/**
 * 省份数据类型
 */
export interface Province {
  name: string;
  centerCoord: [number, number];
  bands: Band[];
  bandCount: number;
}

/**
 * 地图 GeoJSON 类型
 */
export interface ChinaGeoJSON {
  type: 'FeatureCollection';
  features: Array<{
    type: 'Feature';
    properties: {
      name: string;
      cp: [number, number]; // center point
      adcode?: string;
    };
    geometry: {
      type: 'Polygon' | 'MultiPolygon';
      coordinates: number[][][];
    };
  }>;
}
