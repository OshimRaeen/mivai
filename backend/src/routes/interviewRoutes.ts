import express from 'express';
import { createInterview,getInterviewById, getUserInterviews } from '../controllers/interviewController.js';

const router = express.Router();

// The base route will be defined in server.ts as /api/interviews
router.post('/', createInterview);

router.get('/user/:userId', getUserInterviews);

router.get('/:id', getInterviewById);

// You can add more routes here later, like fetching past interviews!
// router.get('/:userId', getUserInterviews);
// router.get('/details/:interviewId', getInterviewById);

export default router;