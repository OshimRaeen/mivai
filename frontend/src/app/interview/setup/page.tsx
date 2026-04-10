'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, Variants } from 'framer-motion';
import { Briefcase, Settings2, FileText, ChevronLeft, BrainCircuit, Target, Building2, Clock } from 'lucide-react';
import Link from 'next/link';
import { useUserStore } from '../../../store/useUserStore';

export default function InterviewSetupPage() {
  const router = useRouter();
  const { setInterviewConfig } = useUserStore();
  
  const [category, setCategory] = useState('Full Stack (MERN)');
  const [difficulty, setDifficulty] = useState('Intermediate');
  const [role, setRole] = useState('');
  const [company, setCompany] = useState(''); // NEW
  const [duration, setDuration] = useState<number>(30); // NEW
  const [experience, setExperience] = useState('Entry Level');
  const [jobDescription, setJobDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = [
    "Behavioral / HR", "English Communication", "Data Structures & Algorithms", 
    "Frontend (React/Next.js)", "Backend (Node/Express)", "Full Stack (MERN)", 
    "AI / Machine Learning", "System Design", "Phone Screening"
  ];
  const difficulties = ["Beginner", "Intermediate", "Advanced", "Expert (FAANG)"];
  const durations = [15, 30, 45, 60];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Save to Zustand global state
    setInterviewConfig({ category, difficulty, role, company, duration, experience, jobDescription });
    router.push('/interview/live');
  };

  const fadeUp: Variants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } } 
  };

  return (
    <main className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] font-sans selection:bg-blue-200 py-12 relative overflow-hidden">
      
      {/* Ambient Background Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-blue-400/20 blur-[120px] mix-blend-multiply" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-cyan-300/20 blur-[120px] mix-blend-multiply" />
      </div>

      <div className="max-w-3xl mx-auto px-6 relative z-10">
        <Link href="/dashboard" className="inline-flex items-center text-[#86868b] hover:text-[#1d1d1f] transition-colors mb-12 font-medium">
          <ChevronLeft className="w-5 h-5 mr-1" /> Back to Dashboard
        </Link>

        <motion.div initial="hidden" animate="show" variants={fadeUp} className="space-y-8">
          <header className="space-y-3">
            <div className="w-12 h-12 bg-white/50 border border-white/80 shadow-sm text-blue-500 rounded-full flex items-center justify-center mb-6">
              <Settings2 className="w-6 h-6" />
            </div>
            <h1 className="text-4xl font-semibold tracking-tight">Configure Interview.</h1>
            <p className="text-xl text-[#1d1d1f]/60 font-medium">Set the parameters for your AI interviewer.</p>
          </header>

          <form onSubmit={handleSubmit} className="bg-white/40 backdrop-blur-3xl border border-white/60 rounded-[2rem] p-8 md:p-10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-8">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-lg font-semibold tracking-tight"><BrainCircuit className="w-5 h-5 text-blue-500" /> Focus</label>
                <div className="relative">
                  <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full appearance-none bg-white/50 border border-white/80 rounded-xl px-5 py-4 text-lg outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-sm cursor-pointer">
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                  <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none text-[#86868b]">▼</div>
                </div>
              </div>
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-lg font-semibold tracking-tight"><Target className="w-5 h-5 text-blue-500" /> Difficulty</label>
                <div className="relative">
                  <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full appearance-none bg-white/50 border border-white/80 rounded-xl px-5 py-4 text-lg outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-sm cursor-pointer">
                    {difficulties.map(diff => <option key={diff} value={diff}>{diff}</option>)}
                  </select>
                  <div className="absolute inset-y-0 right-5 flex items-center pointer-events-none text-[#86868b]">▼</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-black/5 pt-8">
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-lg font-semibold tracking-tight"><Briefcase className="w-5 h-5 text-blue-500" /> Target Role</label>
                <input required type="text" placeholder="e.g., Senior React Engineer" value={role} onChange={(e) => setRole(e.target.value)} className="w-full bg-white/50 border border-white/80 rounded-xl px-5 py-4 text-lg outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-sm placeholder:text-[#86868b]"/>
              </div>
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-lg font-semibold tracking-tight"><Building2 className="w-5 h-5 text-blue-500" /> Target Company</label>
                <input type="text" placeholder="e.g., Google, Stripe, Amazon (Optional)" value={company} onChange={(e) => setCompany(e.target.value)} className="w-full bg-white/50 border border-white/80 rounded-xl px-5 py-4 text-lg outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-sm placeholder:text-[#86868b]"/>
              </div>
            </div>

            <div className="space-y-3 border-t border-black/5 pt-8">
              <label className="flex items-center gap-2 text-lg font-semibold tracking-tight"><Clock className="w-5 h-5 text-blue-500" /> Duration (Minutes)</label>
              <div className="grid grid-cols-4 gap-4">
                {durations.map((min) => (
                  <button key={min} type="button" onClick={() => setDuration(min)} className={`py-3 rounded-xl font-medium transition-all ${duration === min ? 'bg-blue-500 text-white shadow-md' : 'bg-white/50 border border-white/80 text-[#1d1d1f]/70 hover:bg-white hover:text-[#1d1d1f]'}`}>
                    {min}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 border-t border-black/5 pt-8">
              <label className="text-lg font-semibold tracking-tight">Your Experience Level</label>
              <div className="grid grid-cols-3 gap-4">
                {['Entry Level', 'Mid-Level', 'Senior'].map((level) => (
                  <button key={level} type="button" onClick={() => setExperience(level)} className={`py-3 rounded-xl font-medium transition-all ${experience === level ? 'bg-blue-500 text-white shadow-md' : 'bg-white/50 border border-white/80 text-[#1d1d1f]/70 hover:bg-white hover:text-[#1d1d1f]'}`}>
                    {level}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 border-t border-black/5 pt-8">
              <label className="flex items-center gap-2 text-lg font-semibold tracking-tight"><FileText className="w-5 h-5 text-blue-500" /> Job Context</label>
              <textarea required rows={3} placeholder="Paste job requirements or specific topics to test you on..." value={jobDescription} onChange={(e) => setJobDescription(e.target.value)} className="w-full bg-white/50 border border-white/80 rounded-xl px-5 py-4 text-lg outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-sm placeholder:text-[#86868b] resize-none" />
            </div>

            <button type="submit" disabled={isSubmitting} className="w-full bg-[#1d1d1f] hover:bg-black text-white rounded-xl py-4 text-lg font-semibold transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-70 mt-4">
              {isSubmitting ? 'Initializing AI Engine...' : 'Initialize Mock Interview'} 
            </button>
          </form>
        </motion.div>
      </div>
    </main>
  );
}