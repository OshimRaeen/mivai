import { StreamClient } from '@stream-io/node-sdk';
import {type Request,type Response } from 'express';

export const generateToken = async (req: Request, res: Response) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    const apiKey = process.env.STREAM_API_KEY;
    const apiSecret = process.env.STREAM_API_SECRET;

    if (!apiKey || !apiSecret) {
      return res.status(500).json({ error: 'Stream API keys are missing in the server environment.' });
    }

    // Initialize the Server Client
    const client = new StreamClient(apiKey, apiSecret);

    // Token expires in 2 hours (120 minutes * 60 seconds)
    const validity = 60 * 120;
    const token = client.generateUserToken({ user_id: userId, validity_in_seconds: validity });

    res.status(200).json({ token });
  } catch (error: any) {
    console.error('Stream Token Generation Error:', error.message);
    res.status(500).json({ error: 'Failed to generate secure video token.' });
  }
};