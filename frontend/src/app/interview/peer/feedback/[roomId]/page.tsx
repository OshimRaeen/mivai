'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useUserStore } from '../../../../../store/useUserStore';
import { Star, ThumbsUp, TrendingUp, Send, CheckCircle2, Loader2, Sparkles, UserCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PeerFeedbackPage() {
  const { roomId } = useParams() as { roomId: string };
  const router = useRouter();
  const mongoUser = (useUserStore.getState() as any).mongoUser;

  const [roomData, setRoomData] = useState<any>(null);
  const [hoveredStar, setHoveredStar] = useState<number>(0);
  const [rating, setRating] = useState<number>(0);
  const [strengths, setStrengths] = useState('');
  const [weaknesses, setWeaknesses] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rooms/${roomId}`)
      .then(r => r.json())
      .then(setRoomData)
      .catch(() => {});
  }, [roomId]);

  const handleSubmit = async () => {
    if (!rating || !strengths.trim() || !weaknesses.trim() || !mongoUser || !roomData) return;
    setIsSubmitting(true);
    
    // Identify the peer
    const peerId = mongoUser._id === roomData.creatorId ? roomData.peerId : roomData.creatorId;

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rooms/${roomId}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          fromUserId: mongoUser._id, 
          toUserId: peerId, 
          rating, 
          strengths, 
          weaknesses 
        })
      });

      if (!res.ok) throw new Error();
      setSuccess(true);
      
      // 🚀 Route directly back to the matching Liquid Glass Dashboard
      setTimeout(() => router.push('/dashboard'), 2000); 
    } catch {
      setIsSubmitting(false);
    }
  };

  if (!roomData || !mongoUser) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] flex items-center justify-center p-6 relative overflow-hidden font-sans selection:bg-blue-200">
      
      {/* 🚀 macOS Ambient Background Orbs (Matches Dashboard Exactly) */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full bg-blue-400/20 blur-[120px] mix-blend-multiply" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[70vw] h-[70vw] rounded-full bg-purple-400/20 blur-[120px] mix-blend-multiply" />
        <div className="absolute top-[30%] left-[40%] w-[40vw] h-[40vw] rounded-full bg-cyan-300/20 blur-[100px] mix-blend-multiply" />
      </div>

      {/* 🚀 LIQUID GLASS CONTAINER */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }} 
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-2xl bg-white/40 backdrop-blur-3xl border border-white/60 rounded-[2rem] shadow-[0_8px_40px_rgb(0,0,0,0.08)] overflow-hidden relative z-10"
      >
        {/* Header */}
        <div className="h-28 border-b border-[#1d1d1f]/5 flex flex-col justify-center px-10 relative">
          <h1 className="text-3xl font-semibold tracking-tight text-[#1d1d1f] flex items-center gap-3">
            <Sparkles className="w-7 h-7 text-blue-500" /> Peer Evaluation
          </h1>
          <p className="text-sm font-medium text-[#1d1d1f]/50 tracking-tight mt-1">
            Session: <span className="font-semibold text-[#1d1d1f]/70">{roomData.category}</span>
          </p>
        </div>

        {/* Form Body */}
        <div className="p-10 space-y-8">
          
          {/* Star Rating */}
          <div className="space-y-4">
            <label className="text-xs font-semibold text-[#1d1d1f]/60 uppercase tracking-widest flex items-center gap-2">
              <UserCircle className="w-4 h-4 text-[#1d1d1f]/40" /> Overall Rating
            </label>
            <div className="flex items-center gap-3 bg-white/50 w-fit p-3.5 rounded-2xl border border-white/80 shadow-sm">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star} 
                  onClick={() => setRating(star)} 
                  onMouseEnter={() => setHoveredStar(star)} 
                  onMouseLeave={() => setHoveredStar(0)}
                  className={`w-8 h-8 cursor-pointer transition-all duration-300 ${
                    (hoveredStar || rating) >= star 
                      ? 'fill-amber-400 text-amber-400 drop-shadow-[0_2px_10px_rgba(251,191,36,0.4)] scale-110' 
                      : 'text-[#1d1d1f]/10 hover:text-[#1d1d1f]/20'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Text Areas (Light Glass Style) */}
          <div className="space-y-4">
            <label className="text-xs font-semibold text-[#1d1d1f]/60 uppercase tracking-widest flex items-center gap-2">
              <ThumbsUp className="w-4 h-4 text-emerald-500" /> Key Strengths
            </label>
            <textarea 
              value={strengths} 
              onChange={(e) => setStrengths(e.target.value)} 
              placeholder="Algorithm choice, communication clarity, edge case handling..."
              className="w-full h-28 bg-white/50 border border-white/80 rounded-2xl p-5 text-sm text-[#1d1d1f] font-medium outline-none focus:bg-white/80 focus:ring-2 focus:ring-blue-500/20 resize-none transition-all placeholder:text-[#1d1d1f]/30 shadow-sm"
            />
          </div>

          <div className="space-y-4">
            <label className="text-xs font-semibold text-[#1d1d1f]/60 uppercase tracking-widest flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-500" /> Areas for Improvement
            </label>
            <textarea 
              value={weaknesses} 
              onChange={(e) => setWeaknesses(e.target.value)} 
              placeholder="Missed edge cases, readability, time management..."
              className="w-full h-28 bg-white/50 border border-white/80 rounded-2xl p-5 text-sm text-[#1d1d1f] font-medium outline-none focus:bg-white/80 focus:ring-2 focus:ring-blue-500/20 resize-none transition-all placeholder:text-[#1d1d1f]/30 shadow-sm"
            />
          </div>

          {/* Submit Action */}
          <button 
            onClick={handleSubmit} 
            disabled={isSubmitting || success}
            className={`w-full py-4 rounded-2xl font-semibold tracking-wide text-sm flex items-center justify-center gap-3 transition-all duration-500 overflow-hidden relative ${
              success 
                ? 'bg-emerald-500 text-white shadow-[0_8px_30px_rgba(16,185,129,0.3)]' 
                : 'bg-blue-500 hover:bg-blue-600 text-white shadow-[0_8px_30px_rgba(59,130,246,0.3)]'
            } disabled:opacity-70 disabled:cursor-not-allowed`}
          >
            {success ? (
              <><CheckCircle2 className="w-5 h-5" /> Evaluation Saved</>
            ) : isSubmitting ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Securing Data...</>
            ) : (
              <><Send className="w-4 h-4" /> Submit & Return to Dashboard</>
            )}
          </button>
        </div>
      </motion.div>
    </main>
  );
}