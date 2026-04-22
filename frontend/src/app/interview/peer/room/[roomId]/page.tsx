'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
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
} from '@stream-io/video-react-sdk';
import '@stream-io/video-react-sdk/dist/css/styles.css';
import { Activity, AlertTriangle, ChevronRight, ChevronLeft, RefreshCw } from 'lucide-react';
import dynamic from 'next/dynamic';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { motion, AnimatePresence } from 'framer-motion';
import RoleManagerHeader from '../../../../../components/RoleManagerHeader';

const CollaborativeEditor = dynamic(
  () => import('../../../../../components/CollaborativeEditor'),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 w-full h-full bg-[#0a0a0c] rounded-2xl animate-pulse border border-white/5" />
    ),
  }
);

const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY || '';
const CODING_CATEGORIES = [
  'Data Structures & Algorithms',
  'System Design',
  'Frontend (React/Next.js)',
  'Backend (Node/Express)',
  'Full Stack (MERN)',
];

export default function PeerInterviewRoom() {
  const { roomId } = useParams() as { roomId: string };
  const router     = useRouter();
  // Read once at mount — avoids unnecessary re-renders triggered by store changes
  const mongoUser  = (useUserStore.getState() as any).mongoUser;

  const [client,          setClient]          = useState<StreamVideoClient | null>(null);
  const [call,            setCall]            = useState<Call | null>(null);
  const [error,           setError]           = useState<string | null>(null);
  const [roomCategory,    setRoomCategory]    = useState('');
  const [isVideoCollapsed, setIsVideoCollapsed] = useState(false);

  // ── Stable refs so closures always hold the *latest* instance ────────────
  const clientRef  = useRef<StreamVideoClient | null>(null);
  const callRef    = useRef<Call | null>(null);
  const isMounted  = useRef(true);
  /**
   * Guards against double-cleanup.
   * Both the `beforeunload` handler and the effect cleanup can fire on a hard
   * reload; this flag makes the operation idempotent.
   */
  const cleanedUp  = useRef(false);

  // ── Fetch room category (independent from stream init) ───────────────────
  useEffect(() => {
    fetch(`http://localhost:5001/api/rooms/${roomId}`)
      .then(r => r.json())
      .then(d => { if (isMounted.current) setRoomCategory(d.category); })
      .catch(() => {});
  }, [roomId]);

  // ── Idempotent cleanup (leave call + disconnect client) ──────────────────
  const cleanup = useCallback(() => {
    if (cleanedUp.current) return;
    cleanedUp.current = true;
    callRef.current?.leave().catch(() => {});
    clientRef.current?.disconnectUser().catch(() => {});
    callRef.current  = null;
    clientRef.current = null;
  }, []);

  // ── Flush on hard reload / tab close BEFORE page unloads ─────────────────
  useEffect(() => {
    window.addEventListener('beforeunload', cleanup);
    return () => window.removeEventListener('beforeunload', cleanup);
  }, [cleanup]);

  // ── Stream Video initialisation ──────────────────────────────────────────
  useEffect(() => {
    if (!roomId || !mongoUser) return;

    // Reset flags for this fresh mount cycle
    isMounted.current = true;
    cleanedUp.current = false;

    const initializeStream = async () => {
      try {
        const res = await fetch('http://localhost:5001/api/stream/token', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ userId: mongoUser._id }),
        });

        if (!res.ok) throw new Error(`Token fetch failed: ${res.status}`);
        const { token } = await res.json();

        // Component may have unmounted while we were awaiting the token
        if (!isMounted.current) return;

        const videoClient = new StreamVideoClient({
          apiKey,
          user:  { id: mongoUser._id, name: mongoUser.firstName || 'Dev' },
          token,
        });
        clientRef.current = videoClient;

        const activeCall = videoClient.call('default', roomId);

        // join() is idempotent: will rejoin if the call already exists
        await activeCall.join({ create: true });

        /**
         * FIX — explicitly (re-)enable camera + mic after every join.
         *
         * Root cause of the "audio/video missing after reload" bug:
         * On a hard reload the browser tears down the previous MediaStream.
         * The Stream SDK does not automatically re-request device access on
         * rejoin; calling .enable() triggers a fresh getUserMedia() call and
         * re-publishes the tracks to the SFU.
         *
         * We use allSettled so that one device being unavailable (e.g. a
         * headless CI environment) doesn't abort the entire initialisation.
         */
        await Promise.allSettled([
          activeCall.camera.enable(),
          activeCall.microphone.enable(),
        ]);

        // Race condition guard: unmounted while awaiting media permissions
        if (!isMounted.current) {
          activeCall.leave().catch(() => {});
          videoClient.disconnectUser().catch(() => {});
          return;
        }

        callRef.current = activeCall;
        setClient(videoClient);
        setCall(activeCall);
      } catch (err) {
        console.error('[PeerInterviewRoom] Stream init error:', err);
        if (isMounted.current) setError('Media server connection failed.');
      }
    };

    initializeStream();

    return () => {
      isMounted.current = false;
      cleanup();
      setClient(null);
      setCall(null);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, mongoUser]);

  // ── Stable leave handler shared by CallControls + RoleManagerHeader ──────
  const handleLeave = useCallback(async () => {
    cleanup();
    router.push('/interview/peer/feedback/' + roomId);
  }, [cleanup, roomId, router]);

  // ── Retry after error ────────────────────────────────────────────────────
  const handleRetry = useCallback(() => {
    setError(null);
    cleanedUp.current = false;
  }, []);

  // ── Loading / error UI ───────────────────────────────────────────────────
  if (error) {
    return (
      <div className="h-screen bg-[#050505] flex flex-col items-center justify-center gap-4 text-white">
        <AlertTriangle className="w-10 h-10 text-red-500" />
        <p className="text-sm text-white/60">{error}</p>
        <button
          onClick={handleRetry}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-sm transition-colors"
        >
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  if (!client || !call) {
    return (
      <div className="h-screen bg-[#050505] flex flex-col items-center justify-center gap-3 text-white">
        <Activity className="w-8 h-8 text-blue-500 animate-spin" />
        <p className="text-xs text-white/40 tracking-widest uppercase">Connecting…</p>
      </div>
    );
  }

  const isDSA = CODING_CATEGORIES.includes(roomCategory);

  return (
    <main className="h-screen w-screen bg-[#050505] text-white flex flex-col relative overflow-hidden font-sans">
      <StreamVideo client={client}>
        <StreamTheme>
          <StreamCall call={call}>

            <RoleManagerHeader roomId={roomId} onTimeUp={handleLeave} />

            {/* ── Master layout wrapper ───────────────────────────────── */}
            <div className="absolute inset-0 pt-20 pb-6 px-6 flex flex-col">

              {isDSA ? (
                // DSA Mode: full-screen editor + floating PiP
                <div className="flex-1 w-full h-full min-h-0 relative">

                  <CollaborativeEditor roomId={roomId} />

                  {/* Floating Picture-in-Picture video panel */}
                  <motion.div
                    initial={false}
                    animate={{ x: isVideoCollapsed ? 'calc(100% + 40px)' : 0 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="absolute bottom-6 right-6 w-[280px] bg-black border border-white/20 rounded-2xl shadow-2xl overflow-hidden z-[999]"
                  >
                    <button
                      onClick={() => setIsVideoCollapsed(true)}
                      className="absolute top-3 left-3 bg-black/80 border border-white/20 hover:bg-white/20 p-2 rounded-full backdrop-blur-md z-50 text-white shadow-lg transition-colors cursor-pointer"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    <div className="h-[380px] relative">
                      <SpeakerLayout participantsBarPosition="bottom" />
                      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none" />
                      <div className="absolute bottom-3 left-0 right-0 scale-[0.65] origin-bottom pointer-events-auto">
                        <CallControls onLeave={handleLeave} />
                      </div>
                    </div>
                  </motion.div>

                  {/* Restore PiP button (visible only when collapsed) */}
                  <AnimatePresence>
                    {isVideoCollapsed && (
                      <motion.button
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        onClick={() => setIsVideoCollapsed(false)}
                        className="absolute bottom-10 right-0 bg-blue-600 border-l border-y border-white/20 hover:bg-blue-500 p-4 rounded-l-2xl shadow-[0_0_30px_rgba(37,99,235,0.6)] z-[999] cursor-pointer"
                      >
                        <ChevronLeft className="w-6 h-6 text-white" />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>

              ) : (
                // Non-DSA: side-by-side resizable split
                <div className="flex-1 w-full min-h-0">
                  <ResizablePanelGroup className="h-full w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
                    <ResizablePanel defaultSize={50} minSize={30} className="h-full">
                      <CollaborativeEditor roomId={roomId} />
                    </ResizablePanel>
                    <ResizableHandle className="w-1 bg-white/10 hover:bg-blue-500/50 transition-colors" />
                    <ResizablePanel defaultSize={50} minSize={30} className="bg-black relative h-full">
                      <SpeakerLayout participantsBarPosition="bottom" />
                      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 scale-90">
                        <CallControls onLeave={handleLeave} />
                      </div>
                    </ResizablePanel>
                  </ResizablePanelGroup>
                </div>
              )}

            </div>

          </StreamCall>
        </StreamTheme>
      </StreamVideo>
    </main>
  );
}







// 'use client';

// import { useEffect, useState } from 'react';
// import { useParams, useRouter } from 'next/navigation';
// import { useUserStore } from '../../../../../store/useUserStore';
// import { StreamVideo, StreamVideoClient, StreamCall, StreamTheme, SpeakerLayout, CallControls, Call, User } from '@stream-io/video-react-sdk';
// import '@stream-io/video-react-sdk/dist/css/styles.css';
// import { Activity, AlertTriangle, ChevronRight, ChevronLeft } from 'lucide-react';
// import dynamic from 'next/dynamic';
// import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
// import { motion, AnimatePresence } from 'framer-motion';
// import RoleManagerHeader from '../../../../../components/RoleManagerHeader';

// const CollaborativeEditor = dynamic(() => import('../../../../../components/CollaborativeEditor'), { ssr: false, loading: () => <div className="flex-1 w-full h-full bg-[#0a0a0c] rounded-2xl animate-pulse border border-white/5" /> });

// const apiKey = process.env.NEXT_PUBLIC_STREAM_API_KEY || '';
// const CODING_CATEGORIES = ["Data Structures & Algorithms", "System Design", "Frontend (React/Next.js)", "Backend (Node/Express)", "Full Stack (MERN)"];

// export default function PeerInterviewRoom() {
//   const { roomId } = useParams() as { roomId: string };
//   const router = useRouter();
//   const mongoUser = (useUserStore.getState() as any).mongoUser;

//   const [client, setClient] = useState<StreamVideoClient | null>(null);
//   const [call, setCall] = useState<Call | null>(null);
//   const [error, setError] = useState<string | null>(null);
//   const [roomCategory, setRoomCategory] = useState('');
//   const [isVideoCollapsed, setIsVideoCollapsed] = useState(false);

//   useEffect(() => {
//     fetch(`http://localhost:5001/api/rooms/${roomId}`).then(r => r.json()).then(d => setRoomCategory(d.category)).catch(() => {});
//     if (!roomId || !mongoUser) return;
//     let videoClient: StreamVideoClient;

//     const initializeStream = async () => {
//       try {
//         const response = await fetch('http://localhost:5001/api/stream/token', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: mongoUser._id }) });
//         const { token } = await response.json();
//         videoClient = new StreamVideoClient({ apiKey, user: { id: mongoUser._id, name: mongoUser.firstName || 'Dev' }, token });
//         setClient(videoClient);
//         const activeCall = videoClient.call('default', roomId);
//         await activeCall.join({ create: true });
//         setCall(activeCall);
//       } catch { setError("Media server connection failed."); }
//     };
//     initializeStream();
//     return () => { if (videoClient) { videoClient.disconnectUser(); setClient(null); setCall(null); } };
//   }, [roomId, mongoUser]);

//   if (error) return <div className="h-screen bg-[#050505] flex items-center justify-center text-white"><AlertTriangle className="w-10 h-10 text-red-500 mb-4"/></div>;
//   if (!client || !call) return <div className="h-screen bg-[#050505] flex flex-col items-center justify-center text-white"><Activity className="w-8 h-8 text-blue-500 animate-spin mb-4" /></div>;

//   const isDSA = CODING_CATEGORIES.includes(roomCategory);

//   return (
//     <main className="h-screen w-screen bg-[#050505] text-white flex flex-col relative overflow-hidden font-sans">
//       <StreamVideo client={client}>
//         <StreamTheme>
//           <StreamCall call={call}>
            
//             <RoleManagerHeader roomId={roomId} onTimeUp={() => { call.leave(); router.push('/interview/peer/feedback/' + roomId); }} />

//             {/* 🚀 THE MASTER LAYOUT WRAPPER */}
//             <div className="absolute inset-0 pt-20 pb-6 px-6 flex flex-col">
//               {isDSA ? (
//                 <div className="flex-1 w-full h-full min-h-0 relative">
                  
//                   {/* Background: LeetCode Editor (Full Width/Height) */}
//                   <CollaborativeEditor roomId={roomId} />
                  
//                   {/* Foreground: Floating PiP Video */}
//                   <motion.div 
//                     initial={false}
//                     animate={{ x: isVideoCollapsed ? 'calc(100% + 40px)' : 0 }}
//                     transition={{ type: 'spring', damping: 25, stiffness: 200 }}
//                     className="absolute bottom-6 right-6 w-[280px] bg-black border border-white/20 rounded-2xl shadow-2xl overflow-hidden z-[999]"
//                   >
//                     <button onClick={() => setIsVideoCollapsed(true)} className="absolute top-3 left-3 bg-black/80 border border-white/20 hover:bg-white/20 p-2 rounded-full backdrop-blur-md z-50 text-white shadow-lg transition-colors cursor-pointer">
//                       <ChevronRight className="w-4 h-4" />
//                     </button>
                    
//                     <div className="h-[380px] relative">
//                       <SpeakerLayout participantsBarPosition="bottom" />
//                       <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-black to-transparent pointer-events-none" />
//                       <div className="absolute bottom-3 left-0 right-0 scale-[0.65] origin-bottom pointer-events-auto">
//                         <CallControls onLeave={() => { call.leave(); router.push('/interview/peer/feedback/' + roomId); }} />
//                       </div>
//                     </div>
//                   </motion.div>

//                   {/* Toggle Restore Button */}
//                   <AnimatePresence>
//                     {isVideoCollapsed && (
//                       <motion.button 
//                         initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
//                         onClick={() => setIsVideoCollapsed(false)} 
//                         className="absolute bottom-10 right-0 bg-blue-600 border-l border-y border-white/20 hover:bg-blue-500 p-4 rounded-l-2xl shadow-[0_0_30px_rgba(37,99,235,0.6)] z-[999] cursor-pointer"
//                       >
//                         <ChevronLeft className="w-6 h-6 text-white" />
//                       </motion.button>
//                     )}
//                   </AnimatePresence>
//                 </div>
//               ) : (
//                 /* Non-DSA Split Layout */
//                 <div className="flex-1 w-full min-h-0">
//                   <ResizablePanelGroup className="h-full w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
//                     <ResizablePanel defaultSize={50} minSize={30} className="h-full">
//                       <CollaborativeEditor roomId={roomId} />
//                     </ResizablePanel>
//                     <ResizableHandle className="w-1 bg-white/10 hover:bg-blue-500/50 transition-colors" />
//                     <ResizablePanel defaultSize={50} minSize={30} className="bg-black relative h-full">
//                       <SpeakerLayout participantsBarPosition="bottom" />
//                       <div className="absolute bottom-6 left-1/2 -translate-x-1/2 scale-90">
//                         <CallControls onLeave={() => { call.leave(); router.push('/interview/peer/feedback/' + roomId); }} />
//                       </div>
//                     </ResizablePanel>
//                   </ResizablePanelGroup>
//                 </div>
//               )}
//             </div>
            
//           </StreamCall>
//         </StreamTheme>
//       </StreamVideo>
//     </main>
//   );
// }