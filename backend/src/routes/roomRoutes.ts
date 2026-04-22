import express from 'express';
import { findOrCreateMatch, getRoomStatus ,submitFeedback ,getUserPeerHistory } from '../controllers/roomController.js';

const router = express.Router();

// Route: POST /api/rooms/match
router.post('/match', findOrCreateMatch);

// 🚀 NEW: The Feedback Submission Route
router.post('/:roomId/feedback', submitFeedback);

// 🚀 NEW: Expose the history endpoint for the Dashboard
router.get('/history/:userId', getUserPeerHistory);

// Route: GET /api/rooms/:roomId
router.get('/:roomId', getRoomStatus);

export default router;