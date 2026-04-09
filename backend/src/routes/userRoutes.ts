// backend/src/routes/userRoutes.ts
import express from 'express';
import { getUserProfile } from '../controllers/userController.js';

const router = express.Router();

// The :clerkId is a dynamic parameter
router.get('/:clerkId', getUserProfile);

export default router;