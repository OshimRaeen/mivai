export interface IUser {
  clerkId: string;      // The unique ID from our Clerk authentication
  email: string;
  firstName: string;
  lastName: string;
  githubUrl?: string;   // Optional (?) because they might not provide it right away
  techStack: string[];  // Array of strings, e.g., ['React', 'Node.js']
  createdAt: Date;
}




export interface IInterview {
  userId: string;
  category: string;
  difficulty?: string;
  jobRole?: string;
  language?: string;
  problemStatement?: string;
  codeSnippet?: string;
  evaluation: {
    overallScore: number;
    strengths: string[];
    weaknesses: string[];
    codeFeedback: {
      quality: string;
      timeComplexity?: string;  // 🚀 Optional: Only for DSA
      spaceComplexity?: string; // 🚀 Optional: Only for DSA
    };
    communicationFeedback: string;
    finalVerdict: string;
  };
  createdAt?: Date;
}

export interface IFeedback {
  fromUserId: string;
  toUserId: string;
  rating: number;         // 1 to 5 stars
  strengths: string;
  weaknesses: string;
  submittedAt: Date;
}

export interface IRoom {
  roomId: string;
  status: 'waiting' | 'active' | 'completed';
  category: string;
  difficulty: string;
  duration: string | number; 
  experience?: string;       
  targetRole?: string;       
  company?: string;          
  startedAt?: Date;
  creatorId: string;
  peerId?: string;
  createdAt?: Date;
  feedback?: IFeedback[];
}