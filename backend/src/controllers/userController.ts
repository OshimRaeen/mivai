
import {type Request,type Response } from 'express';
import User from '../models/User.js';

export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { clerkId } = req.params;

    
    // 1. THE TYPE GUARD: Prove to TypeScript this is a valid string
    if (!clerkId || typeof clerkId !== 'string') {
      res.status(400).json({ error: 'Invalid or missing Clerk ID' });
      return; // Stop execution immediately
    }

    // 2. THE QUERY: TypeScript now knows 100% that clerkId is a string
    const user = await User.findOne({ clerkId });

    if (!user) {
      res.status(404).json({ error: 'User not found in database' });
      return;
    }

    res.status(200).json(user);
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ error: 'Server error' });
  }
};