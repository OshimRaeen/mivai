'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, Variants, AnimatePresence } from 'framer-motion';
import { 
  Users, Search, Briefcase, Target, Activity, Copy, CheckCircle2, 
  Clock, Building2, BrainCircuit, ChevronLeft, UserCircle2, X, Zap
} from 'lucide-react';
import Link from 'next/link';
import { useUserStore } from '../../../store/useUserStore';

export default function PeerMatchmakingPage() {
  const router = useRouter();
  const mongoUser = (useUserStore.getState() as any).mongoUser;

  const CATEGORIES = [
    "Behavioral / HR", "English Communication", "Data Structures & Algorithms", 
    "Frontend (React/Next.js)", "Backend (Node/Express)", "Full Stack (MERN)", 
    "AI / Machine Learning", "System Design", "Phone Screening"
  ];
  const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced", "Expert (FAANG)"];
  const DURATIONS = [15, 30, 45, 60];
  const EXPERIENCES = ['Entry Level', 'Mid-Level', 'Senior'];

  const [category, setCategory] = useState('Data Structures & Algorithms');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [role, setRole] = useState('');
  const [company, setCompany] = useState('');
  const [duration, setDuration] = useState<number>(45);
  const [experience, setExperience] = useState('Entry Level');

  const [isSearching, setIsSearching] = useState(false);
  // 🚀 NEW: State to hold the room ID when a match is successfully found
  const [matchFoundId, setMatchFoundId] = useState<string | null>(null);
  
  const [inviteLink, setInviteLink] = useState('');
  const [copied, setCopied] = useState(false);

  const handleMatchmaking = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rooms/match`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: mongoUser?._id || 'guest_user',
          category,
          difficulty,
          duration,
          experience,
          targetRole: role,
          company
        })
      });

      const data = await response.json();

      if (data.matched) {
        // 🚀 FIXED: Show Modal instead of instant redirect
        setMatchFoundId(data.room.roomId);
      } else {
        pollForPartner(data.room.roomId);
      }
    } catch (error) {
      console.error(error);
      setIsSearching(false);
    }
  };

  const pollForPartner = (roomId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rooms/${roomId}`);
        const roomData = await res.json();
        
        if (roomData.status === 'active') {
          clearInterval(interval);
          // 🚀 FIXED: Show Modal instead of instant redirect
          setMatchFoundId(roomId);
        }
      } catch (err) {
        console.error(err);
      }
    }, 3000);
    return () => clearInterval(interval);
  };

  const handleInviteFriend = () => {
    const roomId = crypto.randomUUID();
    const link = `${window.location.origin}/interview/peer/room/${roomId}`;
    setInviteLink(link);
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const fadeUp: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
    exit: { opacity: 0, scale: 0.95, transition: { duration: 0.4 } }
  };

  return (
    <main className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] font-sans selection:bg-blue-200 py-12 relative overflow-hidden flex flex-col items-center">
      
      {/* Ambient Background Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-400/20 blur-[120px] mix-blend-multiply" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-cyan-300/20 blur-[120px] mix-blend-multiply" />
      </div>

      <div className="w-full max-w-3xl px-6 relative z-10">
        <Link href="/dashboard" className="inline-flex items-center text-[#86868b] hover:text-[#1d1d1f] transition-colors mb-8 font-medium">
          <ChevronLeft className="w-5 h-5 mr-1" /> Back to Dashboard
        </Link>
      </div>

      <div className="max-w-3xl w-full px-6 relative z-10 flex flex-col items-center">
        <AnimatePresence mode="wait">
          {!isSearching && !matchFoundId ? (
            <motion.div key="setup" initial="hidden" animate="show" exit="exit" variants={fadeUp} className="w-full space-y-8">
              <header className="space-y-3">
                <div className="w-12 h-12 bg-white/50 border border-white/80 shadow-sm text-blue-500 rounded-full flex items-center justify-center mb-6">
                  <Users className="w-6 h-6" />
                </div>
                <h1 className="text-4xl font-semibold tracking-tight">Peer Network.</h1>
                <p className="text-xl text-[#1d1d1f]/60 font-medium">Connect live with another developer.</p>
              </header>

              <form onSubmit={handleMatchmaking} className="bg-white/40 backdrop-blur-3xl border border-white/60 rounded-[2rem] p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-8">
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-lg font-semibold tracking-tight"><BrainCircuit className="w-5 h-5 text-blue-500" /> Focus</label>
                    <div className="relative">
                      <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full appearance-none bg-white/50 border border-white/80 rounded-xl px-5 py-4 text-lg outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-sm cursor-pointer">
                        {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                      <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none text-[#86868b]">▼</div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-lg font-semibold tracking-tight"><Target className="w-5 h-5 text-blue-500" /> Difficulty</label>
                    <div className="relative">
                      <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full appearance-none bg-white/50 border border-white/80 rounded-xl px-5 py-4 text-lg outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-sm cursor-pointer">
                        {DIFFICULTIES.map(diff => <option key={diff} value={diff}>{diff}</option>)}
                      </select>
                      <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none text-[#86868b]">▼</div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-black/5 pt-8">
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-lg font-semibold tracking-tight"><Briefcase className="w-5 h-5 text-blue-500" /> Target Role</label>
                    <input type="text" placeholder="e.g., Frontend Engineer" value={role} onChange={(e) => setRole(e.target.value)} className="w-full bg-white/50 border border-white/80 rounded-xl px-5 py-4 text-lg outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-sm placeholder:text-[#86868b]"/>
                  </div>
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-lg font-semibold tracking-tight"><Building2 className="w-5 h-5 text-blue-500" /> Target Company</label>
                    <input type="text" placeholder="e.g., Google, Stripe (Optional)" value={company} onChange={(e) => setCompany(e.target.value)} className="w-full bg-white/50 border border-white/80 rounded-xl px-5 py-4 text-lg outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-sm placeholder:text-[#86868b]"/>
                  </div>
                </div>

                <div className="space-y-3 border-t border-black/5 pt-8">
                  <label className="flex items-center gap-2 text-lg font-semibold tracking-tight"><Clock className="w-5 h-5 text-blue-500" /> Duration (Minutes)</label>
                  <div className="grid grid-cols-4 gap-4">
                    {DURATIONS.map((min) => (
                      <button key={min} type="button" onClick={() => setDuration(min)} className={`py-3 rounded-xl font-medium transition-all ${duration === min ? 'bg-blue-500 text-white shadow-md' : 'bg-white/50 border border-white/80 text-[#1d1d1f]/70 hover:bg-white hover:text-[#1d1d1f]'}`}>
                        {min}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-3 border-t border-black/5 pt-8">
                  <label className="flex items-center gap-2 text-lg font-semibold tracking-tight"><UserCircle2 className="w-5 h-5 text-blue-500" /> Experience Level</label>
                  <div className="grid grid-cols-3 gap-4">
                    {EXPERIENCES.map((level) => (
                      <button key={level} type="button" onClick={() => setExperience(level)} className={`py-3 rounded-xl font-medium transition-all ${experience === level ? 'bg-blue-500 text-white shadow-md' : 'bg-white/50 border border-white/80 text-[#1d1d1f]/70 hover:bg-white hover:text-[#1d1d1f]'}`}>
                        {level}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 pt-4 border-t border-black/5">
                  <button type="submit" className="flex-[2] bg-[#1d1d1f] hover:bg-black text-white rounded-xl py-4 text-lg font-semibold transition-all shadow-md flex items-center justify-center gap-2">
                    <Search className="w-5 h-5" /> Auto-Match Global Network
                  </button>
                  <button type="button" onClick={handleInviteFriend} className="flex-1 bg-white/50 border border-white/80 hover:bg-white text-[#1d1d1f] rounded-xl py-4 text-lg font-semibold transition-all shadow-sm flex items-center justify-center gap-2">
                    <Users className="w-5 h-5 text-blue-500" /> Invite Friend
                  </button>
                </div>

                <AnimatePresence>
                  {inviteLink && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="pt-2">
                      <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 p-4 rounded-xl">
                        {copied ? <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" /> : <Copy className="w-5 h-5 text-emerald-500 shrink-0" />}
                        <p className="text-sm font-mono text-emerald-800 truncate flex-1">{inviteLink}</p>
                        <span className="text-xs font-bold text-emerald-600 uppercase tracking-widest shrink-0">{copied ? 'Copied' : 'Link Ready'}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </form>
            </motion.div>

          ) : isSearching && !matchFoundId ? (
            
            /* ─── SCANNING UI ─── */
            <motion.div 
              key="radar" 
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center w-full max-w-md bg-white/40 backdrop-blur-3xl border border-white/60 rounded-[2rem] p-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] mt-12"
            >
              <div className="relative flex items-center justify-center w-48 h-48 mb-8">
                <div className="absolute inset-0 rounded-full border border-blue-500/10 shadow-[inset_0_0_40px_rgba(59,130,246,0.05)]" />
                <div className="absolute inset-6 rounded-full border border-blue-500/20" />
                <div className="absolute inset-12 rounded-full border border-blue-500/30" />
                
                <motion.div 
                  animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="absolute inset-0 rounded-full"
                  style={{ background: 'conic-gradient(from 0deg, transparent 70%, rgba(59,130,246,0.1) 100%)' }}
                >
                  <div className="absolute top-0 left-1/2 w-1 h-1/2 bg-gradient-to-b from-blue-400/50 to-transparent -translate-x-1/2 origin-bottom" />
                </motion.div>
                
                <div className="w-16 h-16 bg-white border border-blue-200 rounded-full flex items-center justify-center shadow-lg z-10">
                  <Activity className="w-6 h-6 text-blue-500 animate-pulse" />
                </div>
              </div>
              
              <h2 className="text-2xl font-bold tracking-tight text-[#1d1d1f] mb-3">Scanning Network</h2>
              <p className="text-[#1d1d1f]/60 text-sm font-medium text-center leading-relaxed">
                Awaiting connection for a <span className="text-[#1d1d1f] font-semibold">{difficulty}</span> session in <span className="text-[#1d1d1f] font-semibold">{category}</span>...
              </p>

              <button 
                onClick={() => setIsSearching(false)}
                className="mt-8 flex items-center gap-2 px-6 py-3 rounded-xl bg-white/50 border border-white/80 text-[#1d1d1f]/60 text-sm font-semibold hover:bg-white hover:text-red-500 transition-all shadow-sm"
              >
                <X className="w-4 h-4" /> Cancel Search
              </button>
            </motion.div>

          ) : (

            /* ─── 🚀 NEW: MATCH FOUND MODAL ─── */
            <motion.div 
              key="match-found"
              initial={{ opacity: 0, scale: 0.8 }} 
              animate={{ opacity: 1, scale: 1 }} 
              className="flex flex-col items-center justify-center w-full max-w-md bg-white/60 backdrop-blur-3xl border border-white/80 rounded-[2rem] p-12 shadow-[0_20px_60px_rgb(0,0,0,0.1)] mt-12 relative overflow-hidden"
            >
              {/* Confetti / Success Glow */}
              <div className="absolute inset-0 bg-gradient-to-b from-emerald-400/10 to-transparent pointer-events-none" />

              <div className="w-24 h-24 bg-emerald-100 border-4 border-white rounded-full flex items-center justify-center shadow-lg mb-8 relative z-10">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.2 }}
                >
                  <Zap className="w-12 h-12 text-emerald-500" fill="currentColor" />
                </motion.div>
              </div>

              <h2 className="text-3xl font-bold tracking-tight text-[#1d1d1f] mb-3 relative z-10">Match Found!</h2>
              <p className="text-[#1d1d1f]/70 text-base font-medium text-center leading-relaxed mb-10 relative z-10">
                A peer is ready and waiting in the live interview room.
              </p>

              <button 
                onClick={() => router.push(`/interview/peer/room/${matchFoundId}`)}
                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-xl text-lg font-bold transition-all shadow-[0_8px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_12px_25px_rgba(16,185,129,0.4)] hover:-translate-y-1 flex items-center justify-center gap-2 relative z-10"
              >
                <CheckCircle2 className="w-6 h-6" /> Join Room Now
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}