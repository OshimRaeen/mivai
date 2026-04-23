import mongoose, { Schema, Document } from 'mongoose';
import { type IRoom } from '../types/shared.js'; // Or your specific path

export interface IRoomDocument extends IRoom, Document {}


const feedbackSchema = new Schema({
  fromUserId: { type: String, required: true },
  toUserId: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  strengths: { type: String, required: true },
  weaknesses: { type: String, required: true },
  submittedAt: { type: Date, default: Date.now }
}, { _id: false }); // Disable _id for sub-documents to keep the DB clean

const roomSchema = new Schema<IRoomDocument>({
  roomId: { type: String, required: true, unique: true, index: true },
  status: { type: String, enum: ['waiting', 'active', 'completed'], default: 'waiting', index: true },
  category: { type: String, required: true },
  difficulty: { type: String, required: true },
  
  // 🚀 NEW FIELDS ALLOWED IN DB
  duration: { type: String, required: true, default: "15" },
  experience: { type: String },
  targetRole: { type: String },
  company: { type: String },
  
  creatorId: { type: String, required: true },
  peerId: { type: String },
  startedAt: { type: Date },

  feedback: [feedbackSchema],

  createdAt: { type: Date, default: Date.now } ,
  
});

export default mongoose.models.Room || mongoose.model<IRoomDocument>('Room', roomSchema);