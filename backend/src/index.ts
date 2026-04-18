// backend/src/index.ts
import express, { type Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import webhookRoutes from './routes/webhookRoutes.js';
import userRoutes from './routes/userRoutes.js';

import interviewRoutes from './routes/interviewRoutes.js';

import roomRoutes from './routes/roomRoutes.js'; 

import streamRoutes from './routes/streamRoutes.js';

dotenv.config();
connectDB();

const app: Application = express();
const PORT = process.env.PORT || 5000;

app.use(cors());

// MUST BE ABOVE express.json()
app.use('/api/webhooks', webhookRoutes); 
app.use(express.json());

app.use('/api/users', userRoutes);
app.use('/api/interviews', interviewRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/stream', streamRoutes);

app.listen(PORT, () => {
  console.log(`Server running in development mode on port ${PORT}`);
});