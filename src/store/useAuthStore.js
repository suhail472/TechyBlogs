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

      devBypassLogin: () => {
        if (typeof document !== 'undefined') {
          document.cookie = 'token=dev_bypass_token; path=/; max-age=604800; SameSite=Lax';
        }
        const devUser = {
          _id: 'dev_admin_id',
          name: 'Chief Editor',
          email: 'editor@teachyblogs.com',
          role: 'Editor in Chief',
        };
        set({
          user: devUser,
          isAuthenticated: true,
          loading: false,
          error: null,
        });
        return true;
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
          if (typeof document !== 'undefined') {
            const isBypassed = document.cookie.includes('token=dev_bypass_token');
            if (isBypassed) {
              const devUser = {
                _id: 'dev_admin_id',
                name: 'Chief Editor',
                email: 'editor@teachyblogs.com',
                role: 'Editor in Chief',
              };
              set({ user: devUser, isAuthenticated: true });
              return devUser;
            }
          }
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
