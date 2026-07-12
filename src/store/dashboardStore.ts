import { create } from "zustand";

interface DashboardState {
  isHeroVisible: boolean;
  currentSessionId: string | null;
  setHeroVisible: (visible: boolean) => void;
  setCurrentSessionId: (id: string | null) => void;
}

export const useDashboardStore = create<DashboardState>((set) => ({
  isHeroVisible: true,
  currentSessionId: null,
  setHeroVisible: (visible) => set({ isHeroVisible: visible }),
  setCurrentSessionId: (id) => set({ currentSessionId: id }),
}));
