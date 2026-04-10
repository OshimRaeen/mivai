'use client';

import { useEffect } from 'react';
import { useUser, UserButton } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useUserStore } from '../../store/useUserStore';
import { motion, Variants } from 'framer-motion';
import Link  from 'next/link';
import { Video, Users, ChevronRight, LayoutDashboard, Clock, } from 'lucide-react';

export default function DashboardPage() {
  const { isLoaded, isSignedIn, user } = useUser();
  const router = useRouter();
  const { mongoUser, isLoading, fetchMongoUser } = useUserStore();

  useEffect(() => {
    if (isLoaded && !isSignedIn) router.push('/');
  }, [isLoaded, isSignedIn, router]);

  useEffect(() => {
    if (user?.id) fetchMongoUser(user.id);
  }, [user?.id, fetchMongoUser]);

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
    <main className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] font-sans selection:bg-blue-200 pb-20 relative overflow-hidden">
      
      {/* macOS Style Ambient Background Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full bg-blue-400/20 blur-[120px] md:blur-[160px] mix-blend-multiply" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[70vw] h-[70vw] rounded-full bg-purple-400/20 blur-[120px] md:blur-[160px] mix-blend-multiply" />
        <div className="absolute top-[30%] left-[40%] w-[40vw] h-[40vw] rounded-full bg-cyan-300/20 blur-[100px] md:blur-[140px] mix-blend-multiply" />
      </div>
      
      {/* Liquid Glass Navigation Bar */}
      <nav className="w-full h-14 backdrop-blur-2xl bg-white/40 border-b border-white/50 flex items-center px-6 sticky top-0 z-50 shadow-[0_4px_30px_rgba(0,0,0,0.02)]">
        <div className="max-w-5xl mx-auto w-full flex justify-between items-center">
          <div className="font-semibold text-lg tracking-tight">MIVAI.</div>
          <div className="flex items-center gap-4">
            {isLoading ? (
              <div className="w-24 h-4 bg-black/10 animate-pulse rounded-full" />
            ) : (
              <span className="text-sm font-medium text-[#1d1d1f]/60">{mongoUser?.email}</span>
            )}
            <UserButton  appearance={{ elements: { avatarBox: "w-7 h-7" } }} />
          </div>
        </div>
      </nav>

      {/* Main Content (Relative z-10 keeps it above the background orbs) */}
      <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-5xl mx-auto px-6 py-20 space-y-16 relative z-10">
        
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

        {/* Liquid Glass Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* AI Interview Card */}
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

          {/* Peer Partner Card */}
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
              <span className="inline-flex items-center text-purple-500 font-semibold text-lg group-hover:translate-x-1 transition-transform duration-300">
                Find a match <ChevronRight className="w-5 h-5 ml-1" />
              </span>
            </div>
          </motion.div>

        </div>

        {/* Liquid Glass Empty State Section */}
        <motion.div variants={fadeUp} className="bg-white/40 backdrop-blur-3xl border border-white/60 rounded-[2rem] p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
          <div className="flex items-center gap-3 mb-8">
            <Clock className="w-6 h-6 text-[#1d1d1f]" />
            <h3 className="text-2xl font-semibold tracking-tight">Recent Sessions</h3>
          </div>
          <div className="py-20 flex flex-col items-center justify-center text-center">
            <LayoutDashboard className="w-14 h-14 text-black/20 mb-5 stroke-[1.5]" />
            <h4 className="text-[#1d1d1f] font-semibold text-xl tracking-tight">No sessions yet.</h4>
            <p className="text-[#1d1d1f]/60 font-medium mt-2 text-lg">Your completed interviews will appear here.</p>
          </div>
        </motion.div>

      </motion.div>
    </main>
  );
}