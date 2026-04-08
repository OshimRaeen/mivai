export interface IUser {
  clerkId: string;      // The unique ID from our Clerk authentication
  email: string;
  firstName: string;
  lastName: string;
  githubUrl?: string;   // Optional (?) because they might not provide it right away
  techStack: string[];  // Array of strings, e.g., ['React', 'Node.js']
  createdAt: Date;
}