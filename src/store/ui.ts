import { create } from "zustand";

interface UIState {
  sheets: number;
  openSheet: () => void;
  closeSheet: () => void;
  installSheet: boolean;
  setInstallSheet: (v: boolean) => void;
  online: boolean;
  setOnline: (v: boolean) => void;
  sentCount: number | null;
  setSentCount: (n: number | null) => void;
  navOpen: boolean;
  setNavOpen: (v: boolean) => void;
}

export const useUI = create<UIState>()((set, get) => ({
  sheets: 0,
  openSheet: () => set({ sheets: get().sheets + 1 }),
  closeSheet: () => set({ sheets: Math.max(0, get().sheets - 1) }),
  installSheet: false,
  setInstallSheet: (installSheet) => set({ installSheet }),
  online: typeof navigator === "undefined" || navigator.onLine !== false,
  setOnline: (online) => set({ online }),
  sentCount: null,
  setSentCount: (sentCount) => set({ sentCount }),
  navOpen: false,
  setNavOpen: (navOpen) => set({ navOpen }),
}));
