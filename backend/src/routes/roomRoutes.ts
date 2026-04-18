import express from 'express';
import { findOrCreateMatch, getRoomStatus } from '../controllers/roomController.js';

const router = express.Router();

// Route: POST /api/rooms/match
router.post('/match', findOrCreateMatch);

// Route: GET /api/rooms/:roomId
router.get('/:roomId', getRoomStatus);

export default router;