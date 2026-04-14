import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    console.log('=========================================');
    console.log('📡 SOMETHING HIT THE WEBHOOK!');
    
    // Safely try to find the event type, no matter how Vapi nested it
    const eventType = payload?.message?.type || payload?.type || 'Unknown Event Type';
    console.log(`Event Type: ${eventType}`);
    
    // Print the first 300 characters of the payload just to see what it looks like
    console.log(JSON.stringify(payload).substring(0, 300) + '...');
    console.log('=========================================');

    return NextResponse.json({ received: true }, { status: 200 });

  } catch (error) {
    console.error('Webhook Error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}