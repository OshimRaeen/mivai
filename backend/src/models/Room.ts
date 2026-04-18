import mongoose, { Schema, Document } from 'mongoose';
import { type IRoom } from '@app/shared'; // Or your specific path

export interface IRoomDocument extends IRoom, Document {}

const roomSchema = new Schema<IRoomDocument>({
  roomId: { type: String, required: true, unique: true, index: true },
  status: { type: String, enum: ['waiting', 'active', 'completed'], default: 'waiting', index: true },
  category: { type: String, required: true },
  difficulty: { type: String, required: true },
  
  // 🚀 NEW FIELDS ALLOWED IN DB
  duration: { type: String, required: true, default: "45" },
  experience: { type: String },
  targetRole: { type: String },
  company: { type: String },
  
  creatorId: { type: String, required: true },
  peerId: { type: String },
  startedAt: { type: Date },
  createdAt: { type: Date, default: Date.now, expires: 3600 } 
});

export default mongoose.models.Room || mongoose.model<IRoomDocument>('Room', roomSchema);