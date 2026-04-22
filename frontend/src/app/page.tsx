'use client';

import { motion } from 'framer-motion';
import { Variants } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@clerk/nextjs';
import { ArrowRight, BrainCircuit, Users, Code2, LineChart, ShieldCheck, CheckCircle2, PlayCircle, Star } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function LandingPage() {
  const { isSignedIn } = useAuth();

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] as [number, number, number, number]} }
  };

  return (
    <div className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] font-sans selection:bg-blue-200 relative overflow-hidden flex flex-col">
      
      <Navbar />

      {/* 🚀 macOS Ambient Background Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-blue-400/20 blur-[140px] mix-blend-multiply" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60vw] h-[60vw] rounded-full bg-purple-400/20 blur-[140px] mix-blend-multiply" />
        <div className="absolute top-[40%] left-[50%] -translate-x-1/2 w-[40vw] h-[40vw] rounded-full bg-cyan-300/20 blur-[120px] mix-blend-multiply" />
      </div>

      <main className="flex-1 w-full relative z-10 flex flex-col items-center pt-32 pb-20 px-6">
        
        {/* ─── HERO SECTION ─── */}
        <motion.section variants={containerVariants} initial="hidden" animate="show" className="max-w-6xl mx-auto text-center space-y-8 mt-12 mb-32">
          <motion.div variants={itemVariants} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 border border-white/80 backdrop-blur-md shadow-sm mx-auto">
            <span className="flex h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-widest text-blue-600">The Future of Interview Prep</span>
          </motion.div>

          <motion.h1 variants={itemVariants} className="text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight text-[#1d1d1f] leading-[1.05]">
            Master the Interview. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              Secure the Offer.
            </span>
          </motion.h1>

          <motion.p variants={itemVariants} className="text-xl text-[#1d1d1f]/60 font-semibold tracking-tight max-w-3xl mx-auto leading-relaxed">
            MIVAI combines enterprise-grade AI evaluations with live WebRTC peer collaboration. Stop guessing. Start practicing like a FAANG engineer.
          </motion.p>

          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <Link href={isSignedIn ? "/dashboard" : "/sign-up"} className="w-full sm:w-auto px-8 py-4 bg-blue-600 text-white rounded-full font-bold text-lg flex items-center justify-center gap-2 hover:scale-105 hover:bg-blue-700 transition-all shadow-[0_8px_30px_rgba(37,99,235,0.3)]">
              Start Practicing Free <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="#features" className="w-full sm:w-auto px-8 py-4 bg-white/50 backdrop-blur-xl border border-white/80 text-[#1d1d1f] rounded-full font-bold text-lg flex items-center justify-center hover:bg-white/80 transition-all shadow-sm">
              Explore Features
            </Link>
          </motion.div>


          
        </motion.section>

        {/* ─── FEATURES SECTION ─── */}
        <section id="features" className="max-w-6xl mx-auto w-full mb-32 scroll-mt-24">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-[#1d1d1f]">Everything you need to succeed.</h2>
            <p className="text-lg text-[#1d1d1f]/60 font-medium">Built with cutting-edge tech to simulate real-world technical interviews.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white/50 backdrop-blur-3xl border border-white/80 rounded-[2rem] p-8 shadow-sm hover:shadow-xl transition-all duration-500">
              <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 text-blue-600 rounded-full flex items-center justify-center mb-6">
                <BrainCircuit className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold tracking-tight mb-3">AI Interviewer</h3>
              <p className="text-[#1d1d1f]/60 font-medium leading-relaxed">Conduct behavioral and technical mock interviews with generative AI. Get instantaneous feedback.</p>
            </div>

            <div className="bg-white/50 backdrop-blur-3xl border border-white/80 rounded-[2rem] p-8 shadow-sm hover:shadow-xl transition-all duration-500">
              <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/20 text-purple-600 rounded-full flex items-center justify-center mb-6">
                <Users className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold tracking-tight mb-3">Live P2P Sessions</h3>
              <p className="text-[#1d1d1f]/60 font-medium leading-relaxed">Atomic matchmaking connects you with peers worldwide via secure WebRTC tunnels.</p>
            </div>

            <div className="bg-white/50 backdrop-blur-3xl border border-white/80 rounded-[2rem] p-8 shadow-sm hover:shadow-xl transition-all duration-500">
              <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 rounded-full flex items-center justify-center mb-6">
                <Code2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold tracking-tight mb-3">CRDT Code Editor</h3>
              <p className="text-[#1d1d1f]/60 font-medium leading-relaxed">Experience zero-latency collaborative coding with Yjs and Monaco in a FAANG-style split-pane environment.</p>
            </div>
          </div>
        </section>

        {/* ─── HOW IT WORKS SECTION (NEW) ─── */}
        <section id="how-it-works" className="max-w-6xl mx-auto w-full mb-32 scroll-mt-24">
          <div className="flex flex-col lg:flex-row items-center gap-16 bg-white/40 backdrop-blur-2xl border border-white/60 p-12 rounded-[3rem] shadow-[0_8px_40px_rgb(0,0,0,0.04)]">
            <div className="lg:w-1/2 space-y-6">
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-[#1d1d1f]">How MIVAI Works</h2>
              <p className="text-lg text-[#1d1d1f]/60 font-medium leading-relaxed">
                We've engineered a frictionless loop from practice to perfection. No downloads, no messy setups—just pure coding.
              </p>
              
              <div className="space-y-6 pt-4">
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0">1</div>
                  <div>
                    <h4 className="text-lg font-bold text-[#1d1d1f]">Select your track</h4>
                    <p className="text-[#1d1d1f]/60 font-medium">Choose between an AI Interview or Live Peer Collaboration.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0">2</div>
                  <div>
                    <h4 className="text-lg font-bold text-[#1d1d1f]">Enter the Room</h4>
                    <p className="text-[#1d1d1f]/60 font-medium">Solve customized DSA or System Design prompts in our IDE.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0">3</div>
                  <div>
                    <h4 className="text-lg font-bold text-[#1d1d1f]">Get Analyzed</h4>
                    <p className="text-[#1d1d1f]/60 font-medium">Receive a comprehensive breakdown of your code, communication, and approach.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 🚀 ILLUSTRATION EMBED */}
            <div className="lg:w-1/2 w-full">
              <div className="p-2 bg-white/50 backdrop-blur-xl border border-white/80 rounded-[2rem] shadow-xl relative transform rotate-2 hover:rotate-0 transition-transform duration-500">
                <img 
                  src="https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=2670&auto=format&fit=crop" 
                  alt="Code Editor" 
                  className="w-full h-80 object-cover rounded-[1.5rem] shadow-inner"
                />
                {/* Floating UI Element */}
                <div className="absolute -left-8 top-10 bg-white/80 backdrop-blur-md border border-white p-4 rounded-2xl shadow-xl flex items-center gap-3">
                  <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  <div>
                    <p className="text-xs font-bold text-[#1d1d1f]">Optimal Solution</p>
                    <p className="text-[10px] font-semibold text-[#1d1d1f]/50">O(N log N) Time</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── SUCCESS STORIES (TESTIMONIALS - NEW) ─── */}
        <section id="testimonials" className="max-w-6xl mx-auto w-full mb-32 scroll-mt-24">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-[#1d1d1f]">Engineers who leveled up.</h2>
            <p className="text-lg text-[#1d1d1f]/60 font-medium">Don't just take our word for it.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "Sarah J.", img: "https://i.pravatar.cc/150?u=1", text: "The P2P WebRTC engine is flawless. Practicing with real people under a timer completely removed my interview anxiety." },
              { name: "David M.", img: "https://i.pravatar.cc/150?u=2", text: "I injected my own custom React JSON prompts into the editor. The flexibility of this platform is unmatched." },
              { name: "Priya K.", img: "https://i.pravatar.cc/150?u=3", text: "The AI evaluator caught edge cases in my Java code that I didn't even know existed. Secured my offer in August!" }
            ].map((review, idx) => (
              <div key={idx} className="bg-white/50 backdrop-blur-3xl border border-white/80 rounded-[2rem] p-8 shadow-sm flex flex-col justify-between">
                <div className="flex items-center gap-1 mb-4">
                  {[1,2,3,4,5].map(star => <Star key={star} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-[#1d1d1f]/80 font-medium leading-relaxed mb-8">"{review.text}"</p>
                <div className="flex items-center gap-4">
                  <img src={review.img} alt={review.name} className="w-12 h-12 rounded-full border-2 border-white shadow-sm" />
                  <div>
                    <h4 className="font-bold text-[#1d1d1f] text-sm">{review.name}</h4>
                    
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ─── BOTTOM CTA ─── */}
        <section className="w-full max-w-4xl mx-auto text-center bg-white/50 backdrop-blur-3xl border border-white/80 rounded-[3rem] p-16 shadow-[0_20px_60px_rgba(0,0,0,0.05)] mb-10 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 to-purple-600/5 pointer-events-none" />
          <h2 className="text-4xl md:text-5xl font-bold tracking-tight text-[#1d1d1f] mb-6 relative z-10">Ready to secure the offer?</h2>
          <p className="text-lg text-[#1d1d1f]/60 font-medium mb-10 max-w-xl mx-auto relative z-10">Join the platform designed by engineers, for engineers. Start practicing today.</p>
          
          <Link 
            href={isSignedIn ? "/dashboard" : "/sign-up"} 
            className="inline-flex items-center gap-2 px-10 py-5 bg-blue-600 text-white rounded-full font-bold text-lg hover:bg-blue-700 hover:scale-105 transition-all shadow-[0_10px_30px_rgba(37,99,235,0.3)] relative z-10"
          >
            Create Free Account <ArrowRight className="w-5 h-5" />
          </Link>
        </section>

      </main>

      <Footer />
    </div>
  );
}