import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Role } from "@/lib/types";

interface SessionState {
  citizenId: string | null;
  officialId: string | null;
  role: Role | null;
  loginCitizen: (id: string) => void;
  loginOfficial: (id: string, role: Role) => void;
  logoutCitizen: () => void;
  logoutOfficial: () => void;
}

export const useSession = create<SessionState>()(
  persist(
    (set) => ({
      citizenId: null,
      officialId: null,
      role: null,
      loginCitizen: (citizenId) => set({ citizenId }),
      loginOfficial: (officialId, role) => set({ officialId, role }),
      logoutCitizen: () => set({ citizenId: null }),
      logoutOfficial: () => set({ officialId: null, role: null }),
    }),
    { name: "cx-session" },
  ),
);
