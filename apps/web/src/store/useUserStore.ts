import { create } from 'zustand';
import type { User } from '@anki/types';
import apiClient from '../services/api';

interface UserState {
  user: User | null;
  userId: string | null;
  isLoading: boolean;
  error: string | null;
  initializeUser: () => Promise<void>;
  createUser: (email: string) => Promise<void>;
  logout: () => void;
}

export const useUserStore = create<UserState>((set) => ({
  user: null,
  userId: apiClient.getUserId(),
  isLoading: false,
  error: null,

  initializeUser: async () => {
    set({ isLoading: true, error: null });
    try {
      let userId = apiClient.getUserId();

      if (!userId) {
        // Create a demo user
        const user = await apiClient.createUser('demo@example.com');
        userId = user.id;
        set({ user, userId });
      } else {
        // Fetch existing user
        const user = await apiClient.getUser(userId);
        set({ user, userId });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to initialize user';
      set({ error: errorMessage });
      console.error('Failed to initialize user:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  createUser: async (email: string) => {
    set({ isLoading: true, error: null });
    try {
      const user = await apiClient.createUser(email);
      set({ user, userId: user.id });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create user';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  logout: () => {
    apiClient.clearUserId();
    set({ user: null, userId: null });
  },
}));
