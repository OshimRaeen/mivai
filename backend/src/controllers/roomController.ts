import {type Request,type Response } from 'express';
import Room from '../models/Room.js';
import { v4 as uuidv4 } from 'uuid'; 

export const findOrCreateMatch = async (req: Request, res: Response) => {
  try {
    // 🚀 THE FIX: Extract all the new fields from the frontend request
    const { 
      userId, category, difficulty, duration, experience, targetRole, company 
    } = req.body;

    if (!userId) return res.status(400).json({ error: 'User ID is required' });

    // 1. Atomic Search & Update: Find a waiting room with the EXACT same criteria
    const existingRoom = await Room.findOneAndUpdate(
      { 
        status: 'waiting', 
        category, 
        difficulty,
        duration, // 🚀 NEW: Only match people who want the same interview length!
        creatorId: { $ne: userId } 
      },
      { 
        status: 'active', 
        peerId: userId,
        startedAt: new Date() 
      },
      { new: true }
    );

    if (existingRoom) {
      console.log(`🔗 Match Found! Room: ${existingRoom.roomId} for ${duration} mins`);
      return res.status(200).json({ matched: true, room: existingRoom });
    }

    // 2. If no match is found, create a new waiting room with ALL the user's data
    const roomId = uuidv4();
    const newRoom = await Room.create({
      roomId,
      status: 'waiting',
      category,
      difficulty,
      duration: duration || "45", // 🚀 THE FIX: Save the requested duration
      experience,
      targetRole,
      company,
      creatorId: userId
    });

    console.log(`⏳ Waiting Room Created: ${roomId} for ${duration} mins`);
    return res.status(201).json({ matched: false, room: newRoom });

  } catch (error: any) {
    console.error('Matchmaking Error:', error.message);
    res.status(500).json({ error: 'Failed to process matchmaking.' });
  }
};




export const getRoomStatus = async (req: Request, res: Response) => {
  try {
    const { roomId } = req.params;

    const room = await Room.findOne({ roomId });

    if (!room) {
      return res.status(404).json({ error: 'Room not found.' });
    }

    res.status(200).json(room);
  } catch (error: any) {
    console.error('Error fetching room status:', error.message);
    res.status(500).json({ error: 'Failed to fetch room status.' });
  }
};