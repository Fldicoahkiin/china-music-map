import { create } from 'zustand';

interface MapState {
  selectedProvince: string | null;
  hoveredProvince: string | null;
  setSelectedProvince: (province: string | null) => void;
  setHoveredProvince: (province: string | null) => void;
}

export const useMapStore = create<MapState>((set) => ({
  selectedProvince: null,
  hoveredProvince: null,
  setSelectedProvince: (province) => set({ selectedProvince: province }),
  setHoveredProvince: (province) => set({ hoveredProvince: province }),
}));
