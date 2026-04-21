'use client';

import { useEffect, useState } from 'react';
import { useUserStore } from '../store/useUserStore';
import { Clock, Users, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface RoleManagerHeaderProps {
  roomId: string;
  onTimeUp: () => void;
}

export default function RoleManagerHeader({ roomId, onTimeUp }: RoleManagerHeaderProps) {
  // 🚀 FIX: Pulling both mongoUser AND the new global interviewer state from Zustand
  const { mongoUser, isInterviewer, setIsInterviewer } = useUserStore() as any;
  
  const [roomData, setRoomData] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState<string>('--:--');
  const [phase, setPhase] = useState<1 | 2>(1);
  const [showToast, setShowToast] = useState(false);

  // 1. Fetch the exact room data from MongoDB
  useEffect(() => {
    const fetchRoom = async () => {
      try {
        const res = await fetch(`http://localhost:5001/api/rooms/${roomId}`);
        const data = await res.json();
        setRoomData(data);
      } catch (err) {
        console.error('Failed to fetch room data for timer.');
      }
    };
    fetchRoom();
  }, [roomId]);

  // 2. The Global Synchronized Clock Engine
  useEffect(() => {
    if (!roomData || !mongoUser) return;

    const durationMs = parseInt(roomData.duration) * 60 * 1000;
    const actualStartTime = roomData.startedAt ? new Date(roomData.startedAt).getTime() : new Date(roomData.createdAt).getTime();
    const endTime = actualStartTime + durationMs;
    const halfwayTime = actualStartTime + (durationMs / 2);

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = endTime - now;

      // Check if time is up
      if (remaining <= 0) {
        clearInterval(interval);
        setTimeLeft('00:00');
        onTimeUp();
        return;
      }

      // Format mm:ss
      const minutes = Math.floor(remaining / 60000);
      const seconds = Math.floor((remaining % 60000) / 1000);
      setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);

      // Determine Phase (1st half vs 2nd half)
      const currentPhase = now < halfwayTime ? 1 : 2;
      
      // Trigger halfway toast exactly when phase changes
      if (currentPhase === 2 && phase === 1) {
        setPhase(2);
        setShowToast(true);
        setTimeout(() => setShowToast(false), 5000); // Hide toast after 5s
      } else if (currentPhase === 1 && phase === 2) {
         setPhase(1);
      }

      // 🚀 FIX: Using the global setIsInterviewer instead of local state
      const isCreator = mongoUser._id === roomData.creatorId;
      if (currentPhase === 1) {
        setIsInterviewer(isCreator);
      } else {
        setIsInterviewer(!isCreator);
      }

    }, 1000);

    return () => clearInterval(interval);
  }, [roomData, mongoUser, phase, onTimeUp, setIsInterviewer]);

  if (!roomData) {
    return (
      <header className="h-16 px-6 border-b border-white/10 flex items-center justify-center bg-black/40 backdrop-blur-md z-10 shrink-0">
        <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </header>
    );
  }

  return (
    <header className="h-16 px-6 border-b border-white/10 flex items-center justify-between bg-black/40 backdrop-blur-md z-50 shrink-0 relative">
      
      {/* Left: Room Info */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-semibold tracking-wider text-sm text-white">Live Session</span>
        </div>
        <div className="h-4 w-[1px] bg-white/20" />
        <span className="text-xs font-bold text-white/50 uppercase tracking-widest">{roomData.category}</span>
      </div>

      {/* Center: The Synchronized Timer */}
      <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
        <div className={`flex items-center gap-2 text-xl font-black tracking-widest font-mono ${timeLeft.startsWith('00') ? 'text-red-400 animate-pulse' : 'text-white'}`}>
          <Clock className="w-5 h-5" />
          {timeLeft}
        </div>
      </div>

      {/* Right: Dynamic Role Assignment */}
      <div className="flex items-center gap-3">
        <div className="text-xs font-bold uppercase tracking-widest text-white/40 mr-2">
          Phase {phase}/2
        </div>
        <div className={`flex items-center gap-2 px-4 py-1.5 rounded-full border ${
          isInterviewer 
            ? 'bg-purple-500/20 border-purple-500/50 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.2)]' 
            : 'bg-blue-500/20 border-blue-500/50 text-blue-300 shadow-[0_0_15px_rgba(59,130,246,0.2)]'
        }`}>
          {isInterviewer ? <AlertCircle className="w-4 h-4" /> : <Users className="w-4 h-4" />}
          <span className="text-xs font-bold uppercase tracking-widest">
            {isInterviewer ? 'You are Interviewer' : 'You are Interviewee'}
          </span>
        </div>
      </div>

      {/* The Halfway Switch Toast Overlay */}
      <AnimatePresence>
        {showToast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
            className="absolute top-20 left-1/2 -translate-x-1/2 bg-amber-500 text-black px-6 py-4 rounded-2xl shadow-[0_10px_40px_rgba(245,158,11,0.4)] flex items-center gap-3 border border-amber-300 z-50"
          >
            <CheckCircle2 className="w-6 h-6" />
            <div>
              <h3 className="font-black text-sm uppercase tracking-widest">Halfway Point Reached</h3>
              <p className="text-xs font-semibold opacity-80">It is time to switch roles!</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </header>
  );
}