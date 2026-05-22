import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  organizationName: string;
  organizationLocation: string;
  userName: string;
  userInitials: string;
  userRole: string;
  toggleSidebar: () => void;
  toggleMobileDrawer: () => void;
  setMobileDrawer: (open: boolean) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  addToast: (message: string, type?: IToast['type']) => void;
  removeToast: (id: string) => void;
  updateOrganization: (name: string, location: string) => void;
  updateUser: (name: string, initials: string, role: string) => void;
  resetSettings: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarOpen: true,
      mobileDrawerOpen: false,
      theme: 'light',
      toasts: [],
      organizationName: 'Delhi Public School',
      organizationLocation: 'Bokaro Steel City',
      userName: 'John Doe',
      userInitials: 'JD',
      userRole: 'Teacher Account',
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
      updateOrganization: (name, location) =>
        set({ organizationName: name, organizationLocation: location }),
      updateUser: (name, initials, role) =>
        set({ userName: name, userInitials: initials, userRole: role }),
      resetSettings: () =>
        set({
          organizationName: 'Delhi Public School',
          organizationLocation: 'Bokaro Steel City',
          userName: 'John Doe',
          userInitials: 'JD',
          userRole: 'Teacher Account',
        }),
    }),
    {
      name: 'veda-ui-storage',
      partialize: (state) => ({
        organizationName: state.organizationName,
        organizationLocation: state.organizationLocation,
        userName: state.userName,
        userInitials: state.userInitials,
        userRole: state.userRole,
      }),
    }
  )
);
