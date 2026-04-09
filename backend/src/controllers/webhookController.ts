
import { type Request,type Response } from 'express';
import { Webhook } from 'svix';
import User from '../models/User.js';

export const clerkWebhook = async (req: Request, res: Response): Promise<void> => {
  const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

  if (!WEBHOOK_SECRET) {
    console.error('Missing CLERK_WEBHOOK_SECRET in .env');
    res.status(500).json({ error: 'Server configuration error' });
    return;
  }

  // Extract the security headers from Clerk
  const svix_id = req.headers['svix-id'] as string;
  const svix_timestamp = req.headers['svix-timestamp'] as string;
  const svix_signature = req.headers['svix-signature'] as string;

  if (!svix_id || !svix_timestamp || !svix_signature) {
    res.status(400).json({ error: 'Missing Svix headers' });
    return;
  }

  const payload = req.body;
  const webhook = new Webhook(WEBHOOK_SECRET);
  let evt: any;

  try {
    // Verify the cryptographic signature
    evt = webhook.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_timestamp,
      'svix-signature': svix_signature,
    });
  } catch (err) {
    console.error('Error verifying webhook:', err);
    res.status(400).json({ error: 'Webhook signature verification failed' });
    return;
  }

  // If verification passes, save the user to MongoDB!
  if (evt.type === 'user.created') {
    const { id, email_addresses, first_name, last_name } = evt.data;

    try {
      await User.create({
        clerkId: id,
        email: email_addresses[0].email_address,
        firstName: first_name || '',
        lastName: last_name || '',
      });
      console.log(`✅ Success: User saved to MongoDB -> ${email_addresses[0].email_address}`);
    } catch (error) {
      console.error('Database Error:', error);
      res.status(500).json({ error: 'Failed to save user' });
      return;
    }
  }

  res.status(200).json({ success: true });
};