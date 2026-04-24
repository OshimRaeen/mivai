'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, Variants } from 'framer-motion';
import { 
  CheckCircle2, XCircle, ChevronLeft, Code2, 
  MessageSquare, Activity, AlertTriangle, Target, Terminal,FileText
} from 'lucide-react';

// Shadcn UI Imports
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';

export default function ResultsPage() {
  const params = useParams();
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [progressValue, setProgressValue] = useState(0);

  useEffect(() => {
    const fetchResults = async () => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/interviews/${params.id}`);
        if (!response.ok) throw new Error('Failed to fetch data');
        const json = await response.json();
        setData(json);
        
        // Trigger the progress bar animation after data loads
        setTimeout(() => setProgressValue(json.evaluation.overallScore), 400);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    
    if (params.id) fetchResults();
  }, [params.id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f5f5f7] flex flex-col items-center justify-center text-[#1d1d1f] gap-4 relative overflow-hidden">
        <Activity className="w-10 h-10 text-blue-500 animate-spin z-10" />
        <p className="text-[#1d1d1f]/60 tracking-widest uppercase text-base font-bold z-10">Decrypting AI Evaluation...</p>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[50vw] h-[50vw] bg-blue-400/20 blur-[120px] rounded-full mix-blend-multiply pointer-events-none" />
      </div>
    );
  }

  if (!data) return null;

  const { evaluation, category, difficulty, jobRole, codeSnippet, problemStatement } = data;
  const isHire = evaluation.finalVerdict.toLowerCase().includes('hire') && !evaluation.finalVerdict.toLowerCase().includes('no hire');

  // Animation Variants for a mesmerizing entrance
  const fadeUp: Variants = {
    hidden: { opacity: 0, y: 30 },
    show: { opacity: 1, y: 0, transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] } } 
  };
  const stagger: Variants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };

  return (
    <main className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] p-6 md:p-12 font-sans selection:bg-blue-200 relative overflow-hidden pb-24">
      
      {/* macOS Style Ambient Background Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[70vw] h-[70vw] rounded-full bg-blue-400/20 blur-[120px] mix-blend-multiply" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[70vw] h-[70vw] rounded-full bg-purple-400/20 blur-[120px] mix-blend-multiply" />
      </div>

      <motion.div variants={stagger} initial="hidden" animate="show" className="max-w-5xl mx-auto space-y-8 relative z-10">
        
        {/* Navigation */}
        <motion.button 
          variants={fadeUp}
          onClick={() => router.push('/dashboard')}
          className="flex items-center gap-2 text-[#1d1d1f]/60 hover:text-blue-600 transition-colors text-sm font-bold tracking-wider uppercase mb-4"
        >
          <ChevronLeft className="w-5 h-5" /> Back to Dashboard
        </motion.button>

        {/* Header Section */}
        <motion.header variants={fadeUp} className="bg-white/50 border border-white/80 rounded-[2.5rem] p-10 backdrop-blur-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="space-y-4">
            <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-[#1d1d1f]">{category}</h1>
            <div className="flex flex-wrap items-center gap-3">
              <Badge variant="secondary" className="bg-white/80 text-[#1d1d1f]/80 shadow-sm border-white/80 text-sm py-1.5 px-4">
                {difficulty}
              </Badge>
              <Badge variant="secondary" className="bg-white/80 text-[#1d1d1f]/80 shadow-sm border-white/80 text-sm py-1.5 px-4">
                {jobRole}
              </Badge>
            </div>
          </div>
          
          <div className={`px-8 py-6 rounded-[2rem] border-2 flex items-center gap-5 shadow-sm backdrop-blur-md ${
            isHire ? 'bg-emerald-50/80 border-emerald-200 text-emerald-600' : 'bg-red-50/80 border-red-200 text-red-600'
          }`}>
            {isHire ? <CheckCircle2 className="w-12 h-12" /> : <XCircle className="w-12 h-12" />}
            <div>
              <p className="text-xs uppercase tracking-widest font-bold opacity-70 mb-1">Final Verdict</p>
              <p className="text-3xl font-black tracking-tight">{evaluation.finalVerdict}</p>
            </div>
          </div>
        </motion.header>

        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Scorecard */}
          <motion.div variants={fadeUp}>
            <Card className="h-full bg-white/50 backdrop-blur-3xl border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-[2.5rem] flex flex-col justify-center p-6">
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-base font-bold text-[#1d1d1f]/50 uppercase tracking-widest flex items-center justify-center gap-2">
                  <Target className="w-5 h-5" /> Overall Score
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center space-y-8 pt-2">
                <div className="relative flex items-center justify-center w-40 h-40 rounded-full bg-white/80 border-4 border-white shadow-xl">
                  <span className="text-7xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-br from-blue-600 to-purple-600">
                    {evaluation.overallScore}
                  </span>
                </div>
                <div className="w-full space-y-3">
                  <div className="flex justify-between text-sm font-bold text-[#1d1d1f]/60 uppercase tracking-wider">
                    <span>Needs Work</span>
                    <span>Excellent</span>
                  </div>
                  <Progress value={progressValue} className="h-4 bg-black/5 [&>div]:bg-gradient-to-r [&>div]:from-blue-500 [&>div]:to-purple-500" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Feedback Breakdown */}
          <motion.div variants={fadeUp} className="md:col-span-2">
            <Card className="h-full bg-white/50 backdrop-blur-3xl border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-[2.5rem]">
              <CardContent className="p-10 space-y-10">
                {/* Strengths */}
                <div className="space-y-5">
                  <h3 className="flex items-center gap-3 font-bold text-emerald-600 uppercase text-sm tracking-widest">
                    <CheckCircle2 className="w-6 h-6" /> Core Strengths
                  </h3>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {evaluation.strengths.map((str: string, i: number) => (
                      <li key={i} className="bg-white/80 border border-white p-4 rounded-2xl text-base font-semibold text-[#1d1d1f]/80 flex gap-3 shadow-sm hover:shadow-md transition-shadow">
                        <span className="text-emerald-500 shrink-0 text-xl leading-none">•</span> {str}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <Separator className="bg-[#1d1d1f]/10" />
                
                {/* Weaknesses */}
                <div className="space-y-5">
                  <h3 className="flex items-center gap-3 font-bold text-red-500 uppercase text-sm tracking-widest">
                    <AlertTriangle className="w-6 h-6" /> Areas to Improve
                  </h3>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {evaluation.weaknesses.map((wk: string, i: number) => (
                      <li key={i} className="bg-white/80 border border-white p-4 rounded-2xl text-base font-semibold text-[#1d1d1f]/80 flex gap-3 shadow-sm hover:shadow-md transition-shadow">
                        <span className="text-red-400 shrink-0 text-xl leading-none">•</span> {wk}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Deep Dive Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <motion.div variants={fadeUp}>
            <Card className="h-full bg-white/50 backdrop-blur-3xl border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-[2.5rem]">
              <CardHeader className="px-10 pt-10">
                <CardTitle className="flex items-center gap-3 text-base font-bold text-[#1d1d1f]/60 uppercase tracking-widest">
                  <Code2 className="w-6 h-6 text-blue-500" /> Technical Quality
                </CardTitle>
              </CardHeader>
              <CardContent className="px-10 pb-10 space-y-6">
                {(evaluation.codeFeedback.timeComplexity || evaluation.codeFeedback.spaceComplexity) && (
                  <div className="flex gap-4">
                    {evaluation.codeFeedback.timeComplexity && (
                      <div className="flex-1 bg-white/80 border border-white px-5 py-4 rounded-2xl shadow-sm">
                        <p className="text-xs font-bold text-[#1d1d1f]/50 uppercase tracking-widest mb-2">Time Complexity</p>
                        <p className="font-mono font-bold text-lg text-blue-600">{evaluation.codeFeedback.timeComplexity}</p>
                      </div>
                    )}
                    {evaluation.codeFeedback.spaceComplexity && (
                      <div className="flex-1 bg-white/80 border border-white px-5 py-4 rounded-2xl shadow-sm">
                        <p className="text-xs font-bold text-[#1d1d1f]/50 uppercase tracking-widest mb-2">Space Complexity</p>
                        <p className="font-mono font-bold text-lg text-purple-600">{evaluation.codeFeedback.spaceComplexity}</p>
                      </div>
                    )}
                  </div>
                )}
                <p className="text-lg text-[#1d1d1f]/80 leading-relaxed font-medium">
                  {evaluation.codeFeedback.quality}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={fadeUp}>
            <Card className="h-full bg-white/50 backdrop-blur-3xl border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-[2.5rem]">
              <CardHeader className="px-10 pt-10">
                <CardTitle className="flex items-center gap-3 text-base font-bold text-[#1d1d1f]/60 uppercase tracking-widest">
                  <MessageSquare className="w-6 h-6 text-purple-500" /> Communication
                </CardTitle>
              </CardHeader>
              <CardContent className="px-10 pb-10">
                <p className="text-lg text-[#1d1d1f]/80 leading-relaxed font-medium">
                  {evaluation.communicationFeedback}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

         {/* 🚀 NEW: Problem Statement Card */}
        {problemStatement && (
          <motion.div variants={fadeUp}>
            <Card className="bg-white/50 backdrop-blur-3xl border-white/80 shadow-[0_8px_30px_rgb(0,0,0,0.06)] rounded-[2.5rem] mt-8">
              <CardHeader className="px-10 pt-10">
                <CardTitle className="flex items-center gap-3 text-base font-bold text-[#1d1d1f]/60 uppercase tracking-widest">
                  <FileText className="w-6 h-6 text-emerald-500" /> Problem Statement
                </CardTitle>
              </CardHeader>
              <CardContent className="px-10 pb-10">
                <div className="bg-white/60 border border-white/80 p-6 rounded-2xl shadow-sm">
                  <p className="text-lg text-[#1d1d1f]/80 leading-relaxed font-medium whitespace-pre-wrap">
                    {problemStatement}
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* 🚀 NEW: The Missing Code Snippet (Styled as a macOS Terminal) */}
        {codeSnippet && (
          <motion.div variants={fadeUp}>
            <div className="rounded-[2.5rem] overflow-hidden shadow-[0_20px_50px_rgb(0,0,0,0.15)] border border-white/20 mt-8">
              {/* Terminal Header */}
              <div className="bg-[#1e1e1e] px-6 py-4 flex items-center gap-4">
                <div className="flex gap-2">
                  <div className="w-3.5 h-3.5 rounded-full bg-[#ff5f56]" />
                  <div className="w-3.5 h-3.5 rounded-full bg-[#ffbd2e]" />
                  <div className="w-3.5 h-3.5 rounded-full bg-[#27c93f]" />
                </div>
                <div className="flex items-center gap-2 text-white/40 font-mono text-sm">
                  <Terminal className="w-4 h-4" /> candidate_solution.js
                </div>
              </div>
              {/* Terminal Body */}
              <div className="bg-[#0d0d0d] p-8 overflow-x-auto">
                <pre className="font-mono text-base text-blue-300 leading-relaxed">
                  <code>{codeSnippet}</code>
                </pre>
              </div>
            </div>
          </motion.div>
        )}

      </motion.div>
    </main>
  );
}