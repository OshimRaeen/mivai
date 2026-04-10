import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { IUser } from '@app/shared'; // Keep this if you are using your shared types!

interface InterviewConfig {
  category: string;
  difficulty: string;
  role: string;
  experience: string;
  jobDescription: string;
  company: string;
  duration: number;
}

interface UserState {
  mongoUser: IUser | null;
  isLoading: boolean;
  interviewConfig: InterviewConfig | null;
  fetchMongoUser: (clerkId: string) => Promise<void>;
  setInterviewConfig: (config: InterviewConfig) => void;
  clearInterviewConfig: () => void;
}

// Wrap the entire store in the persist middleware
export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      mongoUser: null,
      isLoading: false,
      interviewConfig: null,
      
      fetchMongoUser: async (clerkId: string) => {
        set({ isLoading: true });
        try {
          const response = await fetch(`http://localhost:5001/api/users/${clerkId}`);
          if (!response.ok) throw new Error('Failed to fetch user');
          const data = await response.json();
          set({ mongoUser: data, isLoading: false });
        } catch (error: any) {
          console.error("Error fetching MongoDB user:", error.message);
          set({ isLoading: false });
        }
      },

      setInterviewConfig: (config) => set({ interviewConfig: config }),
      
      // A helper function so we can clear the config when the interview actually ends
      clearInterviewConfig: () => set({ interviewConfig: null }),
    }),
    {
      name: 'mock-interview-storage', // The unique key used in localStorage
      
      // We only want to save the config and the user data, not the loading states
      partialize: (state) => ({ 
        interviewConfig: state.interviewConfig,
        mongoUser: state.mongoUser 
      }),
    }
  )
);