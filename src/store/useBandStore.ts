import { create } from 'zustand';

interface Band {
  id: string;
  name: string;
  province: string;
  genres: string[];
  description: string;
  links: { type: string; url: string }[];
}

interface BandState {
  allBands: Band[];
  filteredBands: Band[];
  searchQuery: string;
  selectedGenres: string[];
  selectedProvinces: string[];
  setBands: (bands: Band[]) => void;
  filterBands: () => void;
  setSearchQuery: (query: string) => void;
  toggleGenre: (genre: string) => void;
  toggleProvince: (province: string) => void;
}

export const useBandStore = create<BandState>((set, get) => ({
  allBands: [],
  filteredBands: [],
  searchQuery: '',
  selectedGenres: [],
  selectedProvinces: [],
  setBands: (bands) => set({ allBands: bands, filteredBands: bands }),
  filterBands: () => {
    const { allBands, searchQuery, selectedGenres, selectedProvinces } = get();
    const filtered = allBands.filter((band) => {
      const matchesSearch = band.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesGenres = selectedGenres.length === 0 || band.genres.some((g) => selectedGenres.includes(g));
      const matchesProvinces = selectedProvinces.length === 0 || selectedProvinces.includes(band.province);
      return matchesSearch && matchesGenres && matchesProvinces;
    });
    set({ filteredBands: filtered });
  },
  setSearchQuery: (query) => {
    set({ searchQuery: query });
    get().filterBands();
  },
  toggleGenre: (genre) => {
    const { selectedGenres } = get();
    const newGenres = selectedGenres.includes(genre)
      ? selectedGenres.filter((g) => g !== genre)
      : [...selectedGenres, genre];
    set({ selectedGenres: newGenres });
    get().filterBands();
  },
  toggleProvince: (province) => {
    const { selectedProvinces } = get();
    const newProvinces = selectedProvinces.includes(province)
      ? selectedProvinces.filter((p) => p !== province)
      : [...selectedProvinces, province];
    set({ selectedProvinces: newProvinces });
    get().filterBands();
  },
}));
