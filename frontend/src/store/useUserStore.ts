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
  
  // Global Editor State
  editorCode: string;
  editorLanguage: string;
  editorOutput: string;
  
  // 🚀 NEW: Global Interviewer State
  isInterviewer: boolean;

  setEditorOutput: (output: string) => void;
  fetchMongoUser: (clerkId: string) => Promise<void>;
  setInterviewConfig: (config: InterviewConfig) => void;
  clearInterviewConfig: () => void;
  
  setEditorCode: (code: string) => void;
  setEditorLanguage: (lang: string) => void;
  
  // 🚀 NEW: Setter for Interviewer State
  setIsInterviewer: (val: boolean) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      mongoUser: null,
      isLoading: false,
      interviewConfig: null,
      
      editorCode: '// Write your optimized solution here...\n\nfunction solve() {\n  \n}\n',
      editorLanguage: 'javascript',
      editorOutput: '',
      
      // 🚀 NEW: Default state
      isInterviewer: false,

      setEditorOutput: (output) => set({ editorOutput: output }),
      
      fetchMongoUser: async (clerkId: string) => {
        set({ isLoading: true });
        try {
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/${clerkId}`);
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
      
      // 🚀 NEW: Update global interviewer state
      setIsInterviewer: (val) => set({ isInterviewer: val }),
    }),
    {
      name: 'mock-interview-storage',
      partialize: (state) => ({ 
        interviewConfig: state.interviewConfig,
        mongoUser: state.mongoUser 
        // We do NOT persist the code or interviewer role, so it resets fresh on a new interview
      }),
    }
  )
);