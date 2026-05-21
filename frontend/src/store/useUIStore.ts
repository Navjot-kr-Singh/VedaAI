import { create } from 'zustand';

export interface IToast {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
}

interface UIState {
  sidebarOpen: boolean;
  mobileDrawerOpen: boolean;
  theme: 'light' | 'dark';
  toasts: IToast[];
  toggleSidebar: () => void;
  toggleMobileDrawer: () => void;
  setMobileDrawer: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  addToast: (message: string, type?: IToast['type']) => void;
  removeToast: (id: string) => void;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  mobileDrawerOpen: false,
  theme: 'dark',
  toasts: [],
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  toggleMobileDrawer: () => set((state) => ({ mobileDrawerOpen: !state.mobileDrawerOpen })),
  setMobileDrawer: (open) => set({ mobileDrawerOpen: open }),
  setTheme: (theme) => set({ theme }),
  addToast: (message, type = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    set((state) => ({
      toasts: [...state.toasts, { id, type, message }],
    }));
    // Auto remove after 4 seconds
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 4000);
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));
