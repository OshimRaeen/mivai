import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
  mongoUser: any | null; 
  isLoading: boolean;
  interviewConfig: InterviewConfig | null;
  
  // 🚀 NEW: Global Editor State so the AI can read it!
  editorCode: string;
  editorLanguage: string;
  
  fetchMongoUser: (clerkId: string) => Promise<void>;
  setInterviewConfig: (config: InterviewConfig) => void;
  clearInterviewConfig: () => void;
  
  // 🚀 NEW: Functions to update the editor state
  setEditorCode: (code: string) => void;
  setEditorLanguage: (lang: string) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      mongoUser: null,
      isLoading: false,
      interviewConfig: null,
      
      // Default global state for the editor
      editorCode: '// Write your optimized solution here...\n\nfunction solve() {\n  \n}\n',
      editorLanguage: 'javascript',
      
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
      clearInterviewConfig: () => set({ interviewConfig: null }),
      
      setEditorCode: (code) => set({ editorCode: code }),
      setEditorLanguage: (lang) => set({ editorLanguage: lang }),
    }),
    {
      name: 'mock-interview-storage',
      partialize: (state) => ({ 
        interviewConfig: state.interviewConfig,
        mongoUser: state.mongoUser 
        // We do NOT persist the code, so it resets fresh on a new interview
      }),
    }
  )
);