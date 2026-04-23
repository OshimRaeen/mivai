
import mongoose, { Schema, Document } from 'mongoose';

import {type IInterview } from '../types/shared.js'; 

// We combine the Mongoose Document type with our shared interface
export interface IInterviewDocument extends IInterview, Document {}

const interviewSchema = new Schema<IInterviewDocument>({
  userId: { type: String, required: true, index: true },
  category: { type: String, required: true },
  difficulty: { type: String },
  jobRole: { type: String },
  language: { type: String },
  problemStatement: { type: String },
  codeSnippet: { type: String },
  
  evaluation: {
    overallScore: { type: Number, required: true },
    strengths: [{ type: String }],
    weaknesses: [{ type: String }],
    codeFeedback: {
      quality: { type: String, required: true },
      // These are not required in the DB schema anymore!
      timeComplexity: { type: String }, 
      spaceComplexity: { type: String }
    },
    communicationFeedback: { type: String, required: true },
    finalVerdict: { type: String, required: true }
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.models.Interview || mongoose.model<IInterviewDocument>('Interview', interviewSchema);