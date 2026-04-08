

import mongoose, { Schema, Document } from 'mongoose';

import { type IUser } from '@app/shared'; 

// We extend our shared IUser interface with Mongoose's Document interface 
// so Mongoose knows about built-in methods like .save()
export interface IUserDocument extends IUser, Document {}

const UserSchema: Schema = new Schema({
  clerkId: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  githubUrl: { type: String, default: "" },
  techStack: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model<IUserDocument>('User', UserSchema);