'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUserStore } from '../../../../../store/useUserStore';
import { 
  StreamVideo, 
  StreamVideoClient, 
  StreamCall, 
  StreamTheme, 
  SpeakerLayout, 
  CallControls, 
  Call,
  User
} from '@stream-io/video-react-sdk';
import '@stream-io/video-react-sdk/dist/css/styles.css';
import { Activity, AlertTriangle } from 'lucide-react';
import CollaborativeEditor from '../../../../../components/CollaborativeEditor';
import RoleManagerHeader from '../../../../../components/RoleManagerHeader';

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY || '';

export default function PeerInterviewRoom() {
  const { roomId } = useParams() as { roomId: string };
  const router = useRouter();
  const mongoUser = (useUserStore.getState() as any).mongoUser;

  const [client, setClient] = useState<StreamVideoClient | null>(null);
  const [call, setCall] = useState<Call | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!roomId || !mongoUser) return;

    let videoClient: StreamVideoClient;

    const initializeStream = async () => {
      try {
        const response = await fetch('http://localhost:5001/api/stream/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: mongoUser._id }),
        });

        if (!response.ok) throw new Error('Failed to fetch secure video token');
        
        const { token } = await response.json();

        const user: User = {
          id: mongoUser._id,
          name: mongoUser.firstName || 'Developer',
          image: mongoUser.imageUrl || `https://getstream.io/random_png/?id=${mongoUser._id}&name=${mongoUser.firstName}`,
        };

        videoClient = new StreamVideoClient({ apiKey, user, token });
        setClient(videoClient);

        const activeCall = videoClient.call('default', roomId);
        await activeCall.join({ create: true });
        setCall(activeCall);

      } catch (err: any) {
        console.error("Video Initialization Error:", err);
        setError("Failed to connect to the secure media server.");
      }
    };

    initializeStream();

    return () => {
      if (videoClient) {
        videoClient.disconnectUser();
        setClient(null);
        setCall(null);
      }
    };
  }, [roomId, mongoUser]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex flex-col items-center justify-center text-white p-6">
        <div className="bg-red-500/10 border border-red-500/20 p-8 rounded-3xl flex flex-col items-center max-w-md text-center">
          <AlertTriangle className="w-12 h-12 text-red-500 mb-4" />
          <h2 className="text-2xl font-bold mb-2">Connection Failed</h2>
          <p className="text-white/60 mb-8">{error}</p>
          <button 
            onClick={() => router.push('/interview/peer')}
            className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl font-semibold transition-colors"
          >
            Return to Matchmaking
          </button>
        </div>
      </div>
    );
  }

  if (!client || !call) {
    return (
      <div className="min-h-screen bg-[#0a0a0c] flex flex-col items-center justify-center text-white p-6">
        <Activity className="w-10 h-10 text-blue-500 animate-spin mb-6" />
        <h2 className="text-2xl font-bold tracking-widest uppercase text-white/80">Establishing Secure Tunnel</h2>
        <p className="text-white/40 mt-2 text-sm tracking-wider">Connecting to WebRTC media servers...</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0a0a0c] text-white flex flex-col relative overflow-hidden font-sans">
      <StreamVideo client={client}>
        <StreamTheme>
          <StreamCall call={call}>
            
           <RoleManagerHeader 
              roomId={roomId} 
              onTimeUp={() => {
                call.leave();
                router.push('/interview/peer/feedback/' + roomId);
              }} 
            />

            {/* 🚀 SPLIT SCREEN LAYOUT */}
            <div className="flex-1 w-full flex p-6 gap-6 min-h-0">
              
              {/* Left Column: Video Feeds */}
              <div className="w-[30%] min-w-[300px] flex flex-col gap-4">
                <div className="flex-1 rounded-3xl overflow-hidden shadow-2xl border border-white/5 bg-black/60 relative">
                  <SpeakerLayout participantsBarPosition="bottom" />
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-50">
                    <CallControls 
                      onLeave={() => router.push('/interview/peer/feedback/' + roomId)}
                    />
                  </div>
                </div>
              </div>

              {/* Right Column: Shared Workspace */}
              <div className="flex-1 min-w-0">
                <CollaborativeEditor roomId={roomId} />
              </div>

            </div>

          </StreamCall>
        </StreamTheme>
      </StreamVideo>
    </main>
  );
}