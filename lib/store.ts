import { create } from 'zustand';
import type { Band, Genre } from '@/types/band';

interface MapStore {
  // 数据状态
  bands: Band[];
  genres: Genre[];

  // UI 状态
  selectedProvince: string | null;
  searchQuery: string;
  sidebarOpen: boolean;
  selectedBand: Band | null;

  // 计算属性
  filteredBands: Band[];
  provinceBands: Band[];

  // Actions
  setBands: (bands: Band[]) => void;
  setGenres: (genres: Genre[]) => void;
  selectProvince: (province: string | null) => void;
  setSearchQuery: (query: string) => void;
  setSidebarOpen: (open: boolean) => void;
  setSelectedBand: (band: Band | null) => void;

  // 辅助方法
  getBandsByProvince: (province: string) => Band[];
  filterBands: () => Band[];
}

export const useMapStore = create<MapStore>((set, get) => ({
  // 初始状态
  bands: [],
  genres: [],
  selectedProvince: null,
  searchQuery: '',
  sidebarOpen: false,
  selectedBand: null,
  filteredBands: [],
  provinceBands: [],

  // Actions
  setBands: (bands) => {
    set({ bands });
    get().filterBands();
  },

  setGenres: (genres) => set({ genres }),

  selectProvince: (province) => {
    set({
      selectedProvince: province,
      sidebarOpen: province !== null,
      provinceBands: province ? get().getBandsByProvince(province) : []
    });
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
    get().filterBands();
  },

  setSidebarOpen: (open) => {
    set({
      sidebarOpen: open,
      selectedProvince: open ? get().selectedProvince : null
    });
  },

  setSelectedBand: (band) => set({ selectedBand: band }),

  // 辅助方法
  getBandsByProvince: (province) => {
    return get().bands.filter(band => band.province === province);
  },

  filterBands: () => {
    const { bands, searchQuery, selectedProvince } = get();

    let filtered = bands;

    // 按搜索关键词筛选
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(band =>
        band.name.toLowerCase().includes(query) ||
        band.city.toLowerCase().includes(query) ||
        band.genre.toLowerCase().includes(query)
      );
    }

    // 按省份筛选
    if (selectedProvince) {
      filtered = filtered.filter(band => band.province === selectedProvince);
    }

    set({ filteredBands: filtered });
    return filtered;
  }
}));
