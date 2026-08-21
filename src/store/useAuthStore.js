import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authAPI } from '../services/api';

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      loading: false,
      error: null,

      login: async (email, password, token) => {
        set({ loading: true, error: null });
        try {
          const result = await authAPI.login(email, password, token);
          set({
            user: result.admin,
            isAuthenticated: true,
            loading: false,
          });
          return true;
        } catch (error) {
          set({
            error: error.message,
            loading: false,
          });
          return false;
        }
      },

      register: async (name, email, password) => {
        set({ loading: true, error: null });
        try {
          await authAPI.register(name, email, password);
          set({ loading: false });
          return true;
        } catch (error) {
          set({
            error: error.message,
            loading: false,
          });
          return false;
        }
      },

      logout: async () => {
        set({ loading: true });
        try {
          if (typeof document !== 'undefined') {
            document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
          }
          await authAPI.logout();
        } catch (error) {
          // Silently handle
        } finally {
          set({ user: null, isAuthenticated: false, loading: false });
        }
      },

      getMe: async () => {
        try {
          const user = await authAPI.getMe();
          set({ user, isAuthenticated: true });
          return user;
        } catch (error) {
          set({ user: null, isAuthenticated: false });
          return null;
        }
      },

      updatePassword: async (currentPassword, newPassword) => {
        set({ loading: true, error: null });
        try {
          const result = await authAPI.updatePassword(currentPassword, newPassword);
          set({ loading: false });
          return result;
        } catch (error) {
          set({
            error: error.message,
            loading: false,
          });
          throw error;
        }
      },
    }),
    {
      name: 'techy-blogs-auth',
    }
  )
);

export default useAuthStore;
