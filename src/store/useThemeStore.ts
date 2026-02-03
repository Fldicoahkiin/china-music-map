import { create } from 'zustand';

interface Genre {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
}

interface ThemeState {
  currentGenre: Genre;
  setGenre: (genre: Genre) => void;
}

const defaultGenre: Genre = {
  id: 'post-rock',
  name: 'Post-rock',
  primaryColor: '#627d98',
  secondaryColor: '#486581',
  accentColor: '#9fb3c8',
};

export const useThemeStore = create<ThemeState>((set) => ({
  currentGenre: defaultGenre,
  setGenre: (genre) => set({ currentGenre: genre }),
}));
