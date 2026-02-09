import { create } from 'zustand';
import type { Band, Genre } from '@/types/band';

interface MapStore {
  // 数据状态
  bands: Band[];
  genres: Genre[];

  // UI 状态
  selectedProvince: string | null;
  selectedGenre: string | null;
  searchQuery: string;
  sidebarOpen: boolean;
  selectedBand: Band | null;

  // 计算属性
  filteredBands: Band[];
  provinceBands: Band[];
  genreFilteredBands: Band[];

  // Actions
  setBands: (bands: Band[]) => void;
  setGenres: (genres: Genre[]) => void;
  selectProvince: (province: string | null) => void;
  selectGenre: (genre: string | null) => void;
  setSearchQuery: (query: string) => void;
  setSidebarOpen: (open: boolean) => void;
  setSelectedBand: (band: Band | null) => void;

  // 辅助方法
  getBandsByProvince: (province: string) => Band[];
  getBandsByGenre: (genre: string) => Band[];
  filterBands: () => Band[];
}

export const useMapStore = create<MapStore>((set, get) => ({
  // 初始状态
  bands: [],
  genres: [],
  selectedProvince: null,
  selectedGenre: null,
  searchQuery: '',
  sidebarOpen: false,
  selectedBand: null,
  filteredBands: [],
  provinceBands: [],
  genreFilteredBands: [],

  // Actions
  setBands: (bands) => {
    set({ bands });
    get().filterBands();
  },

  setGenres: (genres) => set({ genres }),

  selectProvince: (province) => {
    const { selectedGenre, getBandsByProvince, getBandsByGenre } = get();
    let provinceBands = province ? getBandsByProvince(province) : [];

    // 如果有流派筛选，则同时应用
    if (selectedGenre && provinceBands.length > 0) {
      provinceBands = provinceBands.filter(b => b.genre === selectedGenre);
    }

    set({
      selectedProvince: province,
      sidebarOpen: province !== null,
      selectedBand: null,
      provinceBands
    });
  },

  selectGenre: (genre) => {
    const { bands } = get();
    const genreFilteredBands = genre ? bands.filter(b => b.genre === genre) : bands;
    set({
      selectedGenre: genre,
      genreFilteredBands,
      selectedProvince: null,
      sidebarOpen: false,
      selectedBand: null,
      provinceBands: []
    });
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
    get().filterBands();
  },

  setSidebarOpen: (open) => {
    set({
      sidebarOpen: open,
      selectedProvince: open ? get().selectedProvince : null,
      selectedBand: open ? get().selectedBand : null
    });
  },

  setSelectedBand: (band) => set({ selectedBand: band }),

  // 辅助方法
  getBandsByProvince: (province) => {
    const { bands, selectedGenre } = get();
    let filtered = bands.filter(band => band.province === province);
    if (selectedGenre) {
      filtered = filtered.filter(band => band.genre === selectedGenre);
    }
    return filtered;
  },

  getBandsByGenre: (genre) => {
    return get().bands.filter(band => band.genre === genre);
  },

  filterBands: () => {
    const { bands, searchQuery, selectedProvince, selectedGenre } = get();

    let filtered = bands;

    // 按流派筛选
    if (selectedGenre) {
      filtered = filtered.filter(band => band.genre === selectedGenre);
    }

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

    set({ filteredBands: filtered, genreFilteredBands: selectedGenre ? get().getBandsByGenre(selectedGenre) : bands });
    return filtered;
  }
}));
