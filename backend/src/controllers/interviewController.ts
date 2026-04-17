import {type Request,type Response } from 'express';
import Interview from '../models/Interview.js'; 

// @desc    Save a new AI interview evaluation
// @route   POST /api/interviews
// @access  Public (or Private if you add auth middleware later)
export const createInterview = async (req: Request, res: Response) => {
  try {
    const { 
      userId, 
      category, 
      difficulty, 
      jobRole, 
      language,
      problemStatement, 
      codeSnippet, 
      evaluation 
    } = req.body;

    // Validate that we have the required user link
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required to save an interview.' });
    }

    // Create and save the document in MongoDB
    const newInterview = await Interview.create({
      userId,
      category,
      difficulty,
      jobRole,
      language,
      problemStatement,
      codeSnippet,
      evaluation
    });

    console.log(`💾 Successfully saved interview for user ${userId} | ID: ${newInterview._id}`);

    // Return the newly created document
    res.status(201).json(newInterview);

  } catch (error: any) {
    console.error('Database Error saving interview:', error.message);
    res.status(500).json({ error: 'Failed to save interview to the database.' });
  }
};


export const getInterviewById = async (req: Request, res: Response) => {
  try {
    // req.params.id grabs the ID straight from the URL string
    const interview = await Interview.findById(req.params.id);

    if (!interview) {
      return res.status(404).json({ error: 'Interview not found.' });
    }

    res.status(200).json(interview);
    
  } catch (error: any) {
    console.error('Database Error fetching interview:', error.message);
    
    // Mongoose throws a specific 'CastError' if the ID string isn't a valid MongoDB format
    if (error.name === 'CastError') {
      return res.status(404).json({ error: 'Invalid interview ID format.' });
    }
    
    res.status(500).json({ error: 'Failed to fetch interview from the database.' });
  }
};

// @desc    Fetch all interviews for a specific user
// @route   GET /api/interviews/user/:userId
// @access  Public (or Private later)
export const getUserInterviews = async (req: Request, res: Response) => {
  try {
    // Find all documents matching the userId and sort by newest first (-1)
    const interviews = await Interview.find({ userId: req.params.userId }).sort({ createdAt: -1 });

    // Even if it's empty, we return a 200 status with an empty array
    res.status(200).json(interviews);
    
  } catch (error: any) {
    console.error('Database Error fetching user interviews:', error.message);
    res.status(500).json({ error: 'Failed to fetch interviews from the database.' });
  }
};