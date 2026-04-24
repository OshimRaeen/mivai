'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useUserStore } from '../store/useUserStore';
import { Clock, Users, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface RoleManagerHeaderProps {
  roomId:    string;
  onTimeUp:  () => void;
}

export default function RoleManagerHeader({ roomId, onTimeUp }: RoleManagerHeaderProps) {
  const { mongoUser, isInterviewer, setIsInterviewer } = useUserStore() as any;

  const [roomData,  setRoomData]  = useState<any>(null);
  const [timeLeft,  setTimeLeft]  = useState<string>('--:--');
  const [phase,     setPhase]     = useState<1 | 2>(1);
  const [showToast, setShowToast] = useState(false);

  /**
   * Use a ref to track the current phase inside the interval callback.
   * Without this, the closure over `phase` state would be stale and the
   * halfway toast could fire multiple times or not at all.
   */
  const phaseRef    = useRef<1 | 2>(1);
  const toastTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onTimeUpRef = useRef(onTimeUp);

  // Keep the ref in sync with the latest prop without re-running the interval
  useEffect(() => { onTimeUpRef.current = onTimeUp; }, [onTimeUp]);

  // ── Fetch room data once ──────────────────────────────────────────────────
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rooms/${roomId}`)
      .then(res => res.json())
      .then(setRoomData)
      .catch(() => {});
  }, [roomId]);

  // ── Timer + role assignment ───────────────────────────────────────────────
  useEffect(() => {
    if (!roomData || !mongoUser) return;

    const durationMs   = parseInt(roomData.duration, 10) * 60 * 1000;
    const startTime    = roomData.startedAt
      ? new Date(roomData.startedAt).getTime()
      : new Date(roomData.createdAt).getTime();
    const endTime      = startTime + durationMs;
    const halfwayTime  = startTime + durationMs / 2;

    const tick = () => {
      const now       = Date.now();
      const remaining = endTime - now;

      if (remaining <= 0) {
        setTimeLeft('00:00');
        clearInterval(intervalId);
        onTimeUpRef.current();
        return;
      }

      // Format mm:ss
      const mins = Math.floor(remaining / 60_000).toString().padStart(2, '0');
      const secs = Math.floor((remaining % 60_000) / 1000).toString().padStart(2, '0');
      setTimeLeft(`${mins}:${secs}`);

      // ── Phase detection ───────────────────────────────────────────────────
      const newPhase: 1 | 2 = now < halfwayTime ? 1 : 2;

      if (newPhase !== phaseRef.current) {
        phaseRef.current = newPhase;
        setPhase(newPhase);

        // Only show toast on the transition INTO phase 2
        if (newPhase === 2) {
          setShowToast(true);
          if (toastTimer.current) clearTimeout(toastTimer.current);
          toastTimer.current = setTimeout(() => setShowToast(false), 5000);
        }
      }

      // ── Role assignment ───────────────────────────────────────────────────
      // Phase 1: creator is interviewer  |  Phase 2: creator is interviewee
      const shouldBeInterviewer =
        newPhase === 1
          ? mongoUser._id === roomData.creatorId
          : mongoUser._id !== roomData.creatorId;

      setIsInterviewer(shouldBeInterviewer);
    };

    // Run immediately so there's no 1-second blank on mount
    tick();
    const intervalId = setInterval(tick, 1000);

    return () => {
      clearInterval(intervalId);
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomData, mongoUser]);
  // ↑ Intentionally omitting setIsInterviewer (stable) and onTimeUp (via ref)
  //   to avoid restarting the interval on every render.

  if (!roomData) return null;

  const isUrgent = timeLeft !== '--:--' && timeLeft.startsWith('00:');

  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center pointer-events-none">

      {/* ── Dynamic Island ─────────────────────────────────────────────────── */}
      <div className="bg-black/60 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.8)] rounded-full px-5 py-2 flex items-center gap-4 pointer-events-auto">

        {/* Timer */}
        <div className={`flex items-center gap-2 text-sm font-black tracking-widest font-mono ${isUrgent ? 'text-red-400 animate-pulse' : 'text-white'}`}>
          <Clock className="w-4 h-4" /> {timeLeft}
        </div>

        <div className="w-[1px] h-4 bg-white/20" />

        {/* Phase + role badge */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">
            Phase {phase}/2
          </span>
          <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${
            isInterviewer
              ? 'bg-purple-500/20 border-purple-500/50 text-purple-300'
              : 'bg-blue-500/20  border-blue-500/50  text-blue-300'
          }`}>
            {isInterviewer
              ? <AlertCircle className="w-3 h-3" />
              : <Users       className="w-3 h-3" />}
            <span className="text-[10px] font-bold uppercase tracking-widest">
              {isInterviewer ? 'Interviewer' : 'Interviewee'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Halfway toast ─────────────────────────────────────────────────── */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.9 }}
            animate={{ opacity: 1, y: 15,  scale: 1    }}
            exit={{   opacity: 0,           scale: 0.9  }}
            className="bg-amber-500 text-black px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-3 border-2 border-amber-300 mt-2 pointer-events-auto"
          >
            <CheckCircle2 className="w-6 h-6 shrink-0" />
            <div>
              <h3 className="font-black text-sm uppercase tracking-widest">Halfway Point</h3>
              <p className="text-xs font-bold opacity-80">Time to switch roles!</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}



// 'use client';

// import { useEffect, useState } from 'react';
// import { useUserStore } from '../store/useUserStore';
// import { Clock, Users, AlertCircle, CheckCircle2 } from 'lucide-react';
// import { motion, AnimatePresence } from 'framer-motion';

// interface RoleManagerHeaderProps { roomId: string; onTimeUp: () => void; }

// export default function RoleManagerHeader({ roomId, onTimeUp }: RoleManagerHeaderProps) {
//   const { mongoUser, isInterviewer, setIsInterviewer } = useUserStore() as any;
//   const [roomData, setRoomData] = useState<any>(null);
//   const [timeLeft, setTimeLeft] = useState<string>('--:--');
//   const [phase, setPhase] = useState<1 | 2>(1);
//   const [showToast, setShowToast] = useState(false);

//   useEffect(() => {
//     fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rooms/${roomId}`).then(res => res.json()).then(setRoomData).catch(() => {});
//   }, [roomId]);

//   useEffect(() => {
//     if (!roomData || !mongoUser) return;
//     const durationMs = parseInt(roomData.duration) * 60 * 1000;
//     const actualStartTime = roomData.startedAt ? new Date(roomData.startedAt).getTime() : new Date(roomData.createdAt).getTime();
//     const endTime = actualStartTime + durationMs;
//     const halfwayTime = actualStartTime + (durationMs / 2);

//     const interval = setInterval(() => {
//       const now = Date.now();
//       const remaining = endTime - now;
//       if (remaining <= 0) { clearInterval(interval); setTimeLeft('00:00'); onTimeUp(); return; }

//       setTimeLeft(`${Math.floor(remaining / 60000).toString().padStart(2, '0')}:${Math.floor((remaining % 60000) / 1000).toString().padStart(2, '0')}`);

//       const currentPhase = now < halfwayTime ? 1 : 2;
      
//       // 🚀 RESTORED: Trigger halfway toast exactly when phase changes
//       if (currentPhase === 2 && phase === 1) {
//         setPhase(2);
//         setShowToast(true);
//         setTimeout(() => setShowToast(false), 5000);
//       } else if (currentPhase === 1 && phase === 2) {
//          setPhase(1);
//       }

//       setIsInterviewer(currentPhase === 1 ? mongoUser._id === roomData.creatorId : mongoUser._id !== roomData.creatorId);
//     }, 1000);

//     return () => clearInterval(interval);
//   }, [roomData, mongoUser, phase, onTimeUp, setIsInterviewer]);

//   if (!roomData) return null;

//   return (
//     <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col items-center pointer-events-none">
      
//       {/* 🚀 THE DYNAMIC ISLAND */}
//       <div className="bg-black/60 backdrop-blur-xl border border-white/10 shadow-[0_8px_32px_rgba(0,0,0,0.8)] rounded-full px-5 py-2 flex items-center gap-4 pointer-events-auto">
//         <div className={`flex items-center gap-2 text-sm font-black tracking-widest font-mono ${timeLeft.startsWith('00') ? 'text-red-400 animate-pulse' : 'text-white'}`}>
//           <Clock className="w-4 h-4" /> {timeLeft}
//         </div>
//         <div className="w-[1px] h-4 bg-white/20" />
//         <div className="flex items-center gap-2">
//           <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">Phase {phase}/2</span>
//           <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border ${isInterviewer ? 'bg-purple-500/20 border-purple-500/50 text-purple-300' : 'bg-blue-500/20 border-blue-500/50 text-blue-300'}`}>
//             {isInterviewer ? <AlertCircle className="w-3 h-3" /> : <Users className="w-3 h-3" />}
//             <span className="text-[10px] font-bold uppercase tracking-widest">{isInterviewer ? 'Interviewer' : 'Interviewee'}</span>
//           </div>
//         </div>
//       </div>

//       {/* 🚀 RESTORED: Halfway Toast Overlay */}
//       <AnimatePresence>
//         {showToast && (
//           <motion.div 
//             initial={{ opacity: 0, y: -20, scale: 0.9 }} animate={{ opacity: 1, y: 15, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
//             className="bg-amber-500 text-black px-6 py-4 rounded-3xl shadow-2xl flex items-center gap-3 border-2 border-amber-300 mt-2 pointer-events-auto"
//           >
//             <CheckCircle2 className="w-6 h-6" />
//             <div>
//               <h3 className="font-black text-sm uppercase tracking-widest">Halfway Point</h3>
//               <p className="text-xs font-bold opacity-80">Time to switch roles!</p>
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }