'use client';

import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useUserStore } from '../../store/useUserStore';
import { motion, Variants } from 'framer-motion';
import Link from 'next/link';
import { 
  Video, Users, ChevronRight, LayoutDashboard, Clock, 
  Calendar, CheckCircle2, XCircle, Activity, Star, ThumbsUp, MessageSquare
} from 'lucide-react';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';

export default function DashboardPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const { mongoUser, isLoading, fetchMongoUser } = useUserStore();

  const [interviews, setInterviews] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  const [peerSessions, setPeerSessions] = useState<any[]>([]);
  const [loadingPeer, setLoadingPeer] = useState(true);

  useEffect(() => {
    if (isLoaded && !isSignedIn) router.push('/');
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    if (user?.id) fetchMongoUser(user.id);
  }, [user?.id, fetchMongoUser]);

  useEffect(() => {
    const fetchHistory = async () => {
      if (!mongoUser?._id) return;
      try {
        const response = await fetch(`http://localhost:5001/api/interviews/user/${mongoUser._id}`);
        if (!response.ok) throw new Error('Failed to fetch history');
        const data = await response.json();
        setInterviews(data);
      } catch (error) {
        console.error('Error fetching interview history:', error);
      } finally {
        setLoadingSessions(false);
      }
    };
    fetchHistory();
  }, [mongoUser]);

  useEffect(() => {
    const fetchPeerHistory = async () => {
      if (!mongoUser?._id) return;
      try {
        const response = await fetch(`http://localhost:5001/api/rooms/history/${mongoUser._id}`);
        if (!response.ok) throw new Error('Failed to fetch peer history');
        const data = await response.json();
        setPeerSessions(data);
      } catch (error) {
        console.error('Error fetching peer history:', error);
      } finally {
        setLoadingPeer(false);
      }
    };
    fetchPeerHistory();
  }, [mongoUser]);

  if (!isLoaded) return <div className="min-h-screen bg-[#f5f5f7]" />;

  const fadeUp: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } } 
  };

  const stagger: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };

  return (
    // 🚀 FIX: flex flex-col ensures the footer is pushed to the bottom
    <main className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] font-sans selection:bg-blue-200 relative overflow-hidden flex flex-col">
      
      {/* Ambient Background Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full bg-blue-400/20 blur-[120px] md:blur-[160px] mix-blend-multiply" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[70vw] h-[70vw] rounded-full bg-purple-400/20 blur-[120px] md:blur-[160px] mix-blend-multiply" />
        <div className="absolute top-[30%] left-[40%] w-[40vw] h-[40vw] rounded-full bg-cyan-300/20 blur-[100px] md:blur-[140px] mix-blend-multiply" />
      </div>
      
      <Navbar />

      {/* 🚀 FIX: flex-1 takes up remaining space, pt-32 pushes content away from the Navbar */}
      <motion.div variants={stagger} initial="hidden" animate="show" className="flex-1 w-full max-w-5xl mx-auto px-6 pt-32 pb-20 space-y-16 relative z-10">
        
        {/* Header */}
        <motion.header variants={fadeUp} className="text-center space-y-4">
          <h1 className="text-5xl md:text-6xl font-semibold tracking-tight text-[#1d1d1f]">
            {isLoading ? (
              <div className="h-14 w-64 bg-black/5 animate-pulse rounded-2xl mx-auto" />
            ) : (
              <>Welcome, {mongoUser?.firstName || 'Developer'}.</>
            )}
          </h1>
          <p className="text-xl text-[#1d1d1f]/60 font-medium tracking-tight">
            Your interview practice, perfectly organized.
          </p>
        </motion.header>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div variants={fadeUp} className="group cursor-pointer bg-white/40 backdrop-blur-3xl border border-white/60 rounded-[2rem] p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)] transition-all duration-500 flex flex-col justify-between min-h-[340px]">
            <div>
              <div className="w-14 h-14 bg-white/50 border border-white/80 shadow-sm text-blue-500 rounded-full flex items-center justify-center mb-6">
                <Video className="w-7 h-7" />
              </div>
              <h2 className="text-3xl font-semibold tracking-tight mb-3">AI Interview.</h2>
              <p className="text-[#1d1d1f]/60 text-lg font-medium leading-relaxed max-w-[90%]">
                Practice solo with our advanced AI engine. Get instant, actionable feedback.
              </p>
            </div>
            <div className="mt-8">
              <Link href="/interview/setup" className="inline-flex items-center text-blue-500 font-semibold text-lg group-hover:translate-x-1 transition-transform duration-300">
                Start session <ChevronRight className="w-5 h-5 ml-1" />
              </Link>
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="group cursor-pointer bg-white/40 backdrop-blur-3xl border border-white/60 rounded-[2rem] p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_40px_rgb(0,0,0,0.08)] transition-all duration-500 flex flex-col justify-between min-h-[340px]">
            <div>
              <div className="w-14 h-14 bg-white/50 border border-white/80 shadow-sm text-purple-500 rounded-full flex items-center justify-center mb-6">
                <Users className="w-7 h-7" />
              </div>
              <h2 className="text-3xl font-semibold tracking-tight mb-3">Peer Partner.</h2>
              <p className="text-[#1d1d1f]/60 text-lg font-medium leading-relaxed max-w-[90%]">
                Connect live with another developer via WebRTC for real-time collaboration.
              </p>
            </div>
            <div className="mt-8">
              <Link href="/interview/peer" className="inline-flex items-center text-purple-500 font-semibold text-lg group-hover:translate-x-1 transition-transform duration-300">
                Find a match <ChevronRight className="w-5 h-5 ml-1" />
              </Link>
            </div>
          </motion.div>
        </div>

        {/* AI Interviews Carousel */}
        <motion.div variants={fadeUp} className="space-y-6 relative">
          <div className="flex items-center justify-between px-2 pb-2">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-[#1d1d1f]" />
              <h3 className="text-2xl font-semibold tracking-tight">AI Sessions</h3>
            </div>
            <span className="text-sm text-[#1d1d1f]/40 font-medium tracking-tight hidden md:block">
              Swipe to explore
            </span>
          </div>

          {loadingSessions ? (
            <div className="bg-white/40 backdrop-blur-3xl border border-white/60 rounded-[2rem] p-20 flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <Activity className="w-8 h-8 animate-spin text-blue-500" />
            </div>
          ) : interviews.length === 0 ? (
            <div className="bg-white/40 backdrop-blur-3xl border border-white/60 rounded-[2rem] p-16 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center flex flex-col items-center gap-4">
              <LayoutDashboard className="w-14 h-14 text-[#1d1d1f]/20 mb-2 stroke-[1.5]" />
              <h4 className="text-[#1d1d1f] font-semibold text-xl tracking-tight">No AI sessions yet.</h4>
            </div>
          ) : (
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-12 pt-4 px-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {interviews.map((interview) => {
                const isHire = interview.evaluation.finalVerdict.toLowerCase().includes('hire') && !interview.evaluation.finalVerdict.toLowerCase().includes('no hire');
                return (
                  <div key={interview._id} onClick={() => router.push(`/dashboard/results/${interview._id}`)} className="snap-center md:snap-start shrink-0 w-[85vw] md:w-[380px] cursor-pointer group bg-white/40 backdrop-blur-3xl border border-white/60 rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-500 flex flex-col">
                    <div className="flex justify-between items-start mb-8">
                      <div className={`px-4 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-2 ${isHire ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-red-50 border-red-200 text-red-600'}`}>
                        {isHire ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                        {interview.evaluation.finalVerdict}
                      </div>
                      <div className="flex items-center gap-1.5 text-[#1d1d1f]/50 text-xs font-medium bg-white/50 px-3 py-1.5 rounded-full border border-white/80 shadow-sm">
                        <Calendar className="w-3 h-3" />
                        {new Date(interview.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </div>
                    </div>
                    <div className="space-y-2 mb-8">
                      <h3 className="font-semibold text-2xl tracking-tight text-[#1d1d1f] group-hover:text-blue-600 transition-colors line-clamp-1">{interview.category}</h3>
                      <p className="text-[#1d1d1f]/50 text-sm font-medium tracking-tight">{interview.difficulty} • {interview.jobRole}</p>
                    </div>
                    <div className="flex justify-between items-end mt-auto pt-6 border-t border-[#1d1d1f]/5">
                      <div>
                        <p className="text-xs text-[#1d1d1f]/40 font-medium mb-1">Overall Score</p>
                        <p className="text-3xl font-semibold tracking-tight text-[#1d1d1f]">{interview.evaluation.overallScore}</p>
                      </div>
                      <div className="w-10 h-10 rounded-full bg-white/60 border border-white/80 shadow-sm flex items-center justify-center text-[#1d1d1f]/50 group-hover:bg-blue-500 group-hover:border-blue-500 group-hover:text-white transition-all duration-300"><ChevronRight className="w-5 h-5 ml-0.5" /></div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Peer Evaluations Carousel */}
        <motion.div variants={fadeUp} className="space-y-6 relative">
          <div className="flex items-center justify-between px-2 pb-2">
            <div className="flex items-center gap-3">
              <MessageSquare className="w-6 h-6 text-[#1d1d1f]" />
              <h3 className="text-2xl font-semibold tracking-tight">Peer Evaluations</h3>
            </div>
          </div>

          {loadingPeer ? (
            <div className="bg-white/40 backdrop-blur-3xl border border-white/60 rounded-[2rem] p-20 flex items-center justify-center shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
              <Activity className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          ) : peerSessions.length === 0 ? (
            <div className="bg-white/40 backdrop-blur-3xl border border-white/60 rounded-[2rem] p-16 shadow-[0_8px_30px_rgb(0,0,0,0.04)] text-center flex flex-col items-center gap-4">
              <Users className="w-14 h-14 text-[#1d1d1f]/20 mb-2 stroke-[1.5]" />
              <h4 className="text-[#1d1d1f] font-semibold text-xl tracking-tight">No peer feedback yet.</h4>
              <p className="text-[#1d1d1f]/60 font-medium text-lg">Feedback from live partners will appear here.</p>
            </div>
          ) : (
            <div className="flex overflow-x-auto snap-x snap-mandatory gap-6 pb-12 pt-4 px-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {peerSessions.map((session) => {
                const myFeedback = session.feedback?.find((f: any) => f.toUserId === mongoUser._id);

                return (
                  <div key={session._id} className="snap-center md:snap-start shrink-0 w-[85vw] md:w-[380px] bg-white/40 backdrop-blur-3xl border border-white/60 rounded-[2rem] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] flex flex-col min-h-[280px]">
                    <div className="flex justify-between items-start mb-6">
                      <div className="flex items-center gap-1 bg-white/50 border border-white/80 shadow-sm px-3 py-1.5 rounded-full">
                        {myFeedback ? (
                          <>
                            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            <span className="text-xs font-bold text-[#1d1d1f]">{myFeedback.rating}.0</span>
                          </>
                        ) : (
                          <span className="text-xs font-semibold text-[#1d1d1f]/50">Awaiting Feedback</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[#1d1d1f]/50 text-xs font-medium bg-white/50 px-3 py-1.5 rounded-full border border-white/80 shadow-sm">
                        <Calendar className="w-3 h-3" />
                        {new Date(session.startedAt || session.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </div>
                    </div>

                    <div className="space-y-2 mb-6">
                      <h3 className="font-semibold text-xl tracking-tight text-[#1d1d1f] line-clamp-1">{session.category}</h3>
                      <p className="text-[#1d1d1f]/50 text-sm font-medium tracking-tight">Live WebRTC Session</p>
                    </div>

                    <div className="mt-auto pt-4 border-t border-[#1d1d1f]/5">
                      {myFeedback ? (
                        <div className="space-y-1">
                          <p className="text-xs text-[#1d1d1f]/50 font-medium flex items-center gap-1.5 mb-2">
                            <ThumbsUp className="w-3.5 h-3.5 text-emerald-500" /> Key Strengths
                          </p>
                          <p className="text-sm font-medium text-[#1d1d1f] line-clamp-2 leading-relaxed">
                            "{myFeedback.strengths}"
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm font-medium text-[#1d1d1f]/40 italic">Your partner hasn't submitted their evaluation yet.</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

      </motion.div>
      <Footer />
    </main>
  );
}