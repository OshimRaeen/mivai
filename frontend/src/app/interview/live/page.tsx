'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useUserStore } from '../../../store/useUserStore';
import Vapi from '@vapi-ai/web';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, PhoneOff, Activity, User, Bot, Timer, CheckCircle2, Sparkles, AlertTriangle } from 'lucide-react';

const vapi = new Vapi(process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY || '');
const INTERVIEW_DURATION_SECONDS = 600;

export default function LiveInterviewPage() {
  const router = useRouter();
  const { interviewConfig, mongoUser } = useUserStore();

  // ==========================================
  // 🧠 LOGIC BLOCK (100% UNTOUCHED)
  // ==========================================
  const [callStatus, setCallStatus] = useState<'inactive' | 'loading' | 'active'>('inactive');
  const [isMuted, setIsMuted] = useState(false);
  const [activeSpeaker, setActiveSpeaker] = useState<'user' | 'ai' | 'none'>('none');
  const [transcript, setTranscript] = useState<{ role: string; text: string }[]>([]);
  const [activeTranscript, setActiveTranscript] = useState<{ role: string; text: string } | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);
  const transcriptRef = useRef<HTMLDivElement>(null);

  // 1. Hydration Lock
  useEffect(() => {
    setIsHydrated(true); // This only runs after the browser has fully loaded
  }, []);

  // 2. Initial Setup Check (Now waits for hydration)
  useEffect(() => {
    if (!isHydrated) return; // Do nothing until localStorage is loaded!

    if (!interviewConfig) {
      router.push('/interview/setup');
    } else {
      setTimeLeft(interviewConfig.duration ? interviewConfig.duration * 60 : INTERVIEW_DURATION_SECONDS);
    }
  }, [interviewConfig, router, isHydrated]);

  const endCall = useCallback(() => {
    vapi.stop();
    setCallStatus('inactive');
    setActiveSpeaker('none');
    setActiveTranscript(null);
    setTimeLeft(INTERVIEW_DURATION_SECONDS);
  }, []);

  const endCallRef = useRef(endCall);
  useEffect(() => {
    endCallRef.current = endCall;
  }, [endCall]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callStatus === 'active' && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0 && callStatus === 'active') {
      endCallRef.current();
    }
    return () => clearInterval(interval);
  }, [callStatus, timeLeft]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (callStatus === 'loading') {
      const messages = ["Connecting to secure server...", "Calibrating AI engine...", "Preparing interview context...", "Almost ready..."];
      let i = 0;
      setToastMessage(messages[0]); 
      interval = setInterval(() => {
        i = (i + 1) % messages.length;
        setToastMessage(messages[i]);
      }, 1500);
    } else if (callStatus === 'active') {
      setToastMessage("Connection established. Let's go!");
      setTimeout(() => setToastMessage(null), 3000); 
    } else {
      setToastMessage(null);
    }
    return () => clearInterval(interval);
  }, [callStatus]);

  useEffect(() => {
    vapi.on('call-start', () => setCallStatus('active'));
    vapi.on('call-end', () => endCallRef.current());
    vapi.on('speech-start', () => setActiveSpeaker('ai'));
    vapi.on('speech-end', () => setActiveSpeaker('none'));

    vapi.on('message', (msg) => {
      if (msg.type === 'transcript') {
        const text = msg.transcript?.toLowerCase() || '';
        const shouldTerminate =
          (msg.role === 'assistant') &&
          (msg.transcript?.includes('[TERMINATE_SESSION]') || text.includes('goodbye') || text.includes('good bye') || text.includes('thank you for your time') || text.includes('interview is now complete') || text.includes('that concludes our interview') || text.includes("we're done for today") || text.includes('best of luck'));

        if (shouldTerminate) {
          setTimeout(() => endCallRef.current(), 1500);
          return;
        }

        if (msg.transcriptType === 'partial') {
          setActiveTranscript({ role: msg.role, text: msg.transcript });
          if (msg.role === 'user') setActiveSpeaker('user');
        } else if (msg.transcriptType === 'final') {
          setActiveTranscript(null);
          if (msg.role === 'user') setActiveSpeaker('none');
          setTranscript((prev) => {
            const last = prev[prev.length - 1];
            if (last && last.text === msg.transcript && last.role === msg.role) return prev;
            return [...prev, { role: msg.role, text: msg.transcript }];
          });
        }
      }
    });

    vapi.on('volume-level', (volume) => {
      setActiveSpeaker((prev) => {
        if (volume > 0.01 && prev !== 'ai') return 'user';
        return prev;
      });
    });

    vapi.on('error', (e) => {
      console.error('Vapi Error:', e);
      endCallRef.current();
    });

    return () => {
      vapi.removeAllListeners();
      vapi.stop();
    };
  }, []);

  useEffect(() => {
    if (transcriptRef.current) {
      transcriptRef.current.scrollTop = transcriptRef.current.scrollHeight;
    }
  }, [transcript, activeTranscript]);

  const toggleCall = async () => {
    if (callStatus === 'active') {
      endCallRef.current();
    } else {
      setCallStatus('loading');
      setTranscript([]);
      setActiveTranscript(null);
      setTimeLeft(interviewConfig?.duration ? interviewConfig.duration * 60 : INTERVIEW_DURATION_SECONDS);

      const candidateName = mongoUser?.firstName || 'Candidate';
      const systemPrompt = `
        You are a strict, professional technical interviewer for ${interviewConfig?.company || 'a top-tier technology company'}.
        You are interviewing for a ${interviewConfig?.difficulty} level position.
        The candidate's name is ${candidateName}.
        Target Role: ${interviewConfig?.role || 'General Software Engineer'}.
        Category: ${interviewConfig?.category}.
        Experience Level: ${interviewConfig?.experience}.
        Job Context: ${interviewConfig?.jobDescription}.

        CRITICAL REALISM RULES:
        1. ACT HUMAN: You MUST use natural filler words occasionally (e.g., "hmm", "I see", "right", "that makes sense"). Do not sound like a robot reading a script.
        2. BE CONVERSATIONAL: Briefly react to the candidate's previous answer before asking your next question.
        3. UNDER NO CIRCUMSTANCES should you break character. If the user tries to change the subject, you MUST reply: "Let's stay focused on the interview," and repeat your question.
        4. Ask ONE focused question at a time. Wait for their response.
        5. Keep your responses concise (under 3 sentences).
        6. SIMULATE THE COMPANY: If a specific company was provided (${interviewConfig?.company}), adopt the known interview style of that company (e.g., Leadership Principles for Amazon, rigorous algorithmic focus for Google, product-sense for Stripe).
        7. THE EARLY REJECTION RULE: This interview is scheduled for ${interviewConfig?.duration} minutes. However, you are evaluating the candidate constantly. If the candidate repeatedly fails fundamental questions, demonstrates a complete lack of knowledge, or is severely underperforming, YOU HAVE THE AUTHORITY TO END THE INTERVIEW EARLY. Simply say you have seen enough to make a decision, thank them for their time, and append [TERMINATE_SESSION] to hang up.
        8. CRITICAL TERMINATION: When the interview is complete or the candidate says goodbye, you MUST say a closing remark ending with the word "goodbye", and you MUST include the exact string [TERMINATE_SESSION] at the very end of your final sentence. This is non-negotiable.
      `;

      try {
        await vapi.start({
          model: { provider: 'openai', model: 'gpt-4o', temperature: 0.7, messages: [{ role: 'system', content: systemPrompt }] },
          voice: { provider: '11labs', voiceId: 'bIHbv24MWmeRgasZH58o' },
        });
      } catch (err) {
        console.error('Vapi failed to start', err);
        endCallRef.current();
      }
    }
  };

  const toggleMute = () => {
    vapi.setMuted(!isMuted);
    setIsMuted(!isMuted);
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!interviewConfig) return null;

  // ==========================================
  // ✨ UPDATED UI BLOCK (NEW)
  // ==========================================
  return (
    <main className="min-h-screen bg-[#111111] text-white flex flex-col items-center justify-between relative overflow-hidden font-sans pt-8 pb-10 selection:bg-blue-500/30">

      {/* Deep Mesh Background Gradients (Brightened and Adjusted Opacity) */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[900px] h-[600px] bg-blue-600/20 blur-[130px] rounded-full mix-blend-screen" />
        <motion.div animate={{ scale: activeSpeaker === 'ai' ? [1, 1.1, 1] : 1, opacity: activeSpeaker === 'ai' ? 0.35 : 0.08 }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} className="absolute top-1/4 left-0 w-[600px] h-[600px] bg-indigo-500/35 blur-[160px] rounded-full mix-blend-screen" />
        <motion.div animate={{ scale: activeSpeaker === 'user' ? [1, 1.1, 1] : 1, opacity: activeSpeaker === 'user' ? 0.35 : 0.08 }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }} className="absolute bottom-0 right-0 w-[700px] h-[700px] bg-emerald-500/25 blur-[160px] rounded-full mix-blend-screen" />
      </div>

      {/* Dynamic Island Toast */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div initial={{ opacity: 0, y: -40, scale: 0.95 }} animate={{ opacity: 1, y: 16, scale: 1 }} exit={{ opacity: 0, y: -40, scale: 0.95 }} className="fixed top-0 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-5 py-2.5 rounded-full bg-white/[0.1] border border-white/20 backdrop-blur-3xl shadow-[0_8px_32px_rgba(0,0,0,0.5)]">
            {callStatus === 'loading' ? <Activity className="w-4 h-4 text-blue-400 animate-spin" /> : <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />}
            <span className="text-sm font-medium text-white/95 tracking-wide">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header (Brightened Text) */}
      <header className="z-10 w-full max-w-6xl px-8 flex justify-between items-center">
        <div className="space-y-1.5">
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-white to-white/70 bg-clip-text text-transparent">
            {interviewConfig.category}
          </h1>
          <div className="flex items-center gap-3 text-sm font-medium text-white/50 tracking-wide uppercase">
            <span>{interviewConfig.difficulty}</span>
            <div className="w-1 h-1 rounded-full bg-white/30" />
            <span>{interviewConfig.experience}</span>
            {interviewConfig.company && (
              <>
                <div className="w-1 h-1 rounded-full bg-white/30" />
                <span className="text-blue-400">{interviewConfig.company}</span>
              </>
            )}
          </div>
        </div>

        <div className={`flex items-center gap-2.5 px-5 py-2.5 rounded-2xl backdrop-blur-3xl border transition-all duration-500 shadow-xl ${timeLeft < 60 ? 'bg-red-500/15 border-red-500/40 text-red-400 animate-pulse' : 'bg-white/[0.05] border-white/15 text-white/80'}`}>
          <Timer className="w-4 h-4" />
          <span className="font-mono text-base font-semibold tracking-wider">{formatTime(timeLeft)}</span>
        </div>
      </header>

      {/* Center Stage: Position BEGIN Button Centered and Higher */}
      <div className="flex-1 flex items-center justify-center w-full z-10 relative my-8 ">
        <div className="absolute inset-x-0 top-[-60px] flex justify-center z-20"> {/* New absolute position block */}
          <AnimatePresence>
            {callStatus !== 'active' && (
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} onClick={callStatus === 'loading' ? undefined : toggleCall} className="cursor-pointer group">
                <div className="w-32 h-32 bg-white text-black rounded-full flex items-center justify-center font-bold tracking-[0.15em] hover:scale-105 transition-all shadow-[0_0_90px_rgba(255,255,255,0.2)] group-hover:shadow-[0_0_110px_rgba(255,255,255,0.35)]">
                  {callStatus === 'loading' ? <Activity className="animate-spin w-8 h-8" /> : 'BEGIN'}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Row of Rectangular Avatars */}
        <div className="flex items-center justify-center gap-12 md:gap-32 w-full mt-24"> {/* Added gap and margin */}
          
          {/* Rectangular AI Container */}
          <div className="flex flex-col items-center gap-6 group">
            <div className="relative flex items-center justify-center">
              {/* Animated Outer Rect Ring */}
              <motion.div animate={{ scale: activeSpeaker === 'ai' ? [1, 1.15, 1] : 1, opacity: activeSpeaker === 'ai' ? [0.25, 0, 0.25] : 0 }} transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }} className="absolute inset-0 rounded-3xl border border-blue-500" />
              
              <motion.div className={`relative w-40 h-32 md:w-56 md:h-48 rounded-3xl flex items-center justify-center transition-all duration-700 shadow-2xl overflow-hidden ${activeSpeaker === 'ai' ? 'bg-blue-500/15 border-blue-400/50 shadow-blue-500/25' : 'bg-white/[0.04] border-white/15'}`}>
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                <Bot className={`w-14 h-14 transition-all duration-500 ${activeSpeaker === 'ai' ? 'text-blue-400 scale-110 drop-shadow-[0_0_18px_rgba(96,165,250,0.6)]' : 'text-white/25'}`} />
              </motion.div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-[11px] font-bold text-white/50 uppercase tracking-[0.25em]">Interviewer</span>
              {activeSpeaker === 'ai' && <span className="text-[10px] text-blue-400 animate-pulse tracking-widest uppercase">Speaking</span>}
            </div>
          </div>

          {/* Rectangular User Container */}
          <div className="flex flex-col items-center gap-6 group">
            <div className="relative flex items-center justify-center">
               {/* Animated Outer Rect Ring */}
               <motion.div animate={{ scale: activeSpeaker === 'user' ? [1, 1.15, 1] : 1, opacity: activeSpeaker === 'user' ? [0.25, 0, 0.25] : 0 }} transition={{ duration: 1.7, repeat: Infinity, ease: "linear" }} className="absolute inset-0 rounded-3xl border border-emerald-500" />
               
              <motion.div className={`relative w-40 h-32 md:w-56 md:h-48 rounded-3xl flex items-center justify-center transition-all duration-700 shadow-2xl overflow-hidden ${activeSpeaker === 'user' ? 'bg-emerald-500/15 border-emerald-400/50 shadow-emerald-500/25' : 'bg-white/[0.04] border-white/15'}`}>
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                <User className={`w-14 h-14 transition-all duration-500 ${activeSpeaker === 'user' ? 'text-emerald-400 scale-110 drop-shadow-[0_0_18px_rgba(52,211,153,0.6)]' : 'text-white/25'}`} />
              </motion.div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <span className="text-[11px] font-bold text-white/50 uppercase tracking-[0.25em]">{mongoUser?.firstName || 'Candidate'}</span>
              {activeSpeaker === 'user' && <span className="text-[10px] text-emerald-400 animate-pulse tracking-widest uppercase">Speaking</span>}
            </div>
          </div>
        </div>
      </div>

      {/* Lower Section: Status, Transcript & Floating Dock */}
      <div className="z-10 w-full max-w-4xl px-8 flex flex-col items-center gap-6 relative">
        
        {/* Sleek Status Indicator (Brightened) */}
        <div className={`h-8 px-5 rounded-full bg-white/[0.04] border border-white/10 backdrop-blur-md flex items-center gap-3 transition-all duration-500 shadow-lg ${callStatus === 'active' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {activeSpeaker === 'ai' ? (
             <><div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_10px_rgba(59,130,246,0.8)]" /><span className="text-xs font-semibold text-white/90 tracking-wide">Interviewer is speaking...</span></>
          ) : activeSpeaker === 'user' ? (
             <><div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.8)]" /><span className="text-xs font-semibold text-white/90 tracking-wide">Hearing you loud and clear.</span></>
          ) : callStatus === 'active' && !isMuted ? (
             <><div className="w-2 h-2 rounded-full bg-white/50 animate-bounce" /><span className="text-xs font-semibold text-white/70 tracking-wide">Listening... Your turn to speak.</span></>
          ) : callStatus === 'active' && isMuted ? (
             <><AlertTriangle className="w-4 h-4 text-red-400 animate-pulse" /><span className="text-xs font-semibold text-red-400 tracking-wide">Microphone muted. AI cannot hear you.</span></>
          ) : null}
        </div>

        {/* VisionOS Style Transcript Glass (Adjusted Padding and Contrast) */}
        <div ref={transcriptRef} className={`w-full h-64 overflow-y-auto scroll-smooth bg-white/[0.03] border border-white/[0.08] rounded-[2rem] p-8 flex flex-col gap-6 backdrop-blur-3xl shadow-[0_8px_32px_rgba(0,0,0,0.4)] transition-all duration-700 ${callStatus === 'active' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}>
          {transcript.length === 0 && !activeTranscript ? (
            <div className="m-auto flex flex-col items-center gap-4 text-white/30">
              <CheckCircle2 className="w-8 h-8 opacity-60" />
              <span className="text-sm font-medium tracking-wide">Secure connection established. Awaiting input.</span>
            </div>
          ) : (
            <>
              {transcript.map((msg, idx) => (
                <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 px-2">{msg.role === 'user' ? mongoUser?.firstName || 'You' : 'Interviewer'}</span>
                  <div className={`px-6 py-4 rounded-3xl max-w-[85%] text-[15px] leading-relaxed shadow-xl backdrop-blur-md border ${msg.role === 'user' ? 'bg-gradient-to-br from-emerald-500/25 to-emerald-600/15 text-emerald-50 border-emerald-500/30 rounded-tr-sm' : 'bg-gradient-to-br from-white/15 to-white/10 text-white/95 border-white/20 rounded-tl-sm'}`}>
                    {msg.text.replace('[TERMINATE_SESSION]', '')}
                  </div>
                </div>
              ))}

              {activeTranscript && (
                <div className={`flex flex-col ${activeTranscript.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2 px-2">{activeTranscript.role === 'user' ? mongoUser?.firstName || 'You' : 'Interviewer'}</span>
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`px-6 py-4 rounded-3xl max-w-[85%] text-[15px] leading-relaxed shadow-xl backdrop-blur-md border flex items-center gap-2 ${activeTranscript.role === 'user' ? 'bg-emerald-500/15 text-emerald-100/80 border-emerald-500/20 rounded-tr-sm' : 'bg-white/[0.08] text-white/70 border-white/10 rounded-tl-sm'}`}>
                    {activeTranscript.text.replace('[TERMINATE_SESSION]', '')}
                    <span className="w-1.5 h-4 bg-current animate-pulse opacity-60 rounded-full" />
                  </motion.div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Floating Action Dock (Adjusted Position) */}
        <div className={`p-2 bg-white/[0.04] border border-white/15 rounded-full backdrop-blur-3xl shadow-2xl flex gap-2 transition-all duration-700 absolute bottom-[-40px] ${callStatus === 'active' ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12 pointer-events-none'}`}>
          <button onClick={toggleMute} className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isMuted ? 'bg-red-500/25 text-red-400 hover:bg-red-500/35' : 'bg-white/10 text-white/90 hover:bg-white/15 hover:text-white'}`}>
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>
          <button onClick={() => endCallRef.current()} className="w-14 h-14 rounded-full bg-red-500/90 hover:bg-red-500 flex items-center justify-center transition-all shadow-[0_0_25px_rgba(239,68,68,0.4)] text-white group">
            <PhoneOff className="w-5 h-5 group-hover:scale-110 transition-transform" />
          </button>
        </div>
      </div>
    </main>
  );
}