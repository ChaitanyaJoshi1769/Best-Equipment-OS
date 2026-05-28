import { create } from 'zustand';

interface AppStore {
  organizationId: string | null;
  selectedVehicleId: string | null;
  selectedJobId: string | null;
  sidebarOpen: boolean;
  setOrganizationId: (id: string) => void;
  setSelectedVehicleId: (id: string | null) => void;
  setSelectedJobId: (id: string | null) => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useAppStore = create<AppStore>((set) => ({
  organizationId: null,
  selectedVehicleId: null,
  selectedJobId: null,
  sidebarOpen: true,

  setOrganizationId: (id: string) => set({ organizationId: id }),
  setSelectedVehicleId: (id: string | null) => set({ selectedVehicleId: id }),
  setSelectedJobId: (id: string | null) => set({ selectedJobId: id }),
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),
}));
