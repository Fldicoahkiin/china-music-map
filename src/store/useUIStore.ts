import { create } from 'zustand';

interface UIState {
  isSidebarOpen: boolean;
  isAdminPanelOpen: boolean;
  toggleSidebar: () => void;
  openAdminPanel: () => void;
  closeAdminPanel: () => void;
}

export const useUIStore = create<UIState>((set) => ({
  isSidebarOpen: false,
  isAdminPanelOpen: false,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  openAdminPanel: () => set({ isAdminPanelOpen: true }),
  closeAdminPanel: () => set({ isAdminPanelOpen: false }),
}));
