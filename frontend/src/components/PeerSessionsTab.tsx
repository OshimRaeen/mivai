'use client';

import { useEffect, useState } from 'react';
import { useUserStore } from '../store/useUserStore';
import { Star, ThumbsUp, TrendingUp, Calendar, Code2, Loader2 } from 'lucide-react';

export default function PeerSessionsTab() {
  const mongoUser = (useUserStore.getState() as any).mongoUser;
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!mongoUser) return;
    const fetchHistory = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rooms/history/${mongoUser._id}`);
        const data = await res.json();
        setSessions(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [mongoUser]);

  if (loading) return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 text-white/40 animate-spin" /></div>;
  if (sessions.length === 0) return <div className="text-center p-12 text-white/40 text-sm font-bold tracking-widest uppercase">No peer sessions completed yet.</div>;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
      {sessions.map((session, idx) => {
        // Find the feedback written ABOUT the current user
        const myFeedback = session.feedback?.find((f: any) => f.toUserId === mongoUser._id);
        
        return (
          <div key={idx} className="bg-white/[0.02] backdrop-blur-xl border border-white/5 rounded-3xl p-8 hover:bg-white/[0.04] transition-all">
            
            {/* Header */}
            <div className="flex items-center justify-between mb-6 pb-6 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <Code2 className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white tracking-wider">{session.category}</h3>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest mt-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> 
                    {new Date(session.startedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full">
                Completed
              </span>
            </div>

            {/* Feedback Content */}
            {!myFeedback ? (
              <p className="text-xs text-white/30 italic">Awaiting peer evaluation...</p>
            ) : (
              <div className="space-y-5">
                <div className="flex items-center gap-1 bg-black/40 w-fit px-3 py-1.5 rounded-full border border-white/5">
                  {[1,2,3,4,5].map(star => (
                    <Star key={star} className={`w-3.5 h-3.5 ${myFeedback.rating >= star ? 'fill-amber-400 text-amber-400' : 'text-white/10'}`} />
                  ))}
                  <span className="text-[10px] font-bold text-white/50 ml-2">{myFeedback.rating}.0</span>
                </div>

                <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <ThumbsUp className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Strengths</span>
                  </div>
                  <p className="text-xs text-white/80 leading-relaxed">{myFeedback.strengths}</p>
                </div>

                <div className="bg-black/20 p-4 rounded-2xl border border-white/5">
                  <div className="flex items-center gap-2 mb-2">
                    <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                    <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Growth Areas</span>
                  </div>
                  <p className="text-xs text-white/80 leading-relaxed">{myFeedback.weaknesses}</p>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}