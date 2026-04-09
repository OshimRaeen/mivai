
import { create } from 'zustand';

import type { IUser } from '@app/shared'; 

interface UserState {
  mongoUser: IUser | null;
  isLoading: boolean;
  fetchMongoUser: (clerkId: string) => Promise<void>;
}

export const useUserStore = create<UserState>((set) => ({
  mongoUser: null,
  isLoading: false,
  
  // This function will call our Express backend
  fetchMongoUser: async (clerkId: string) => {
    set({ isLoading: true });
    try {
      const response = await fetch(`http://localhost:5001/api/users/${clerkId}`);
      
      if (!response.ok) throw new Error('Failed to fetch user');
      
      const data = await response.json();
      set({ mongoUser: data, isLoading: false });
    } catch (error) {
      console.error("Error fetching MongoDB user:", error);
      set({ isLoading: false });
    }
  },
}));