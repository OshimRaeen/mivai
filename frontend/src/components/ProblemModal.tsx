'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, Lightbulb, Code2, Lock, AlertCircle, CheckCircle2, RotateCcw } from 'lucide-react';
import { useUserStore } from '../store/useUserStore';

interface ProblemModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeProblem: any;
  onSetProblem: (problemJson: any) => void;
  onClearProblem: () => void;
}

const JSON_TEMPLATE = `{
  "title": "Merge K Sorted Lists",
  "difficulty": "Hard",
  "category": "Linked Lists / Priority Queue",
  "description": "You are given an array of k linked-lists...",
  "examples": [
    "Input: lists = [[1,4,5],[1,3,4],[2,6]]\\nOutput: [1,1,2,3,4,4,5,6]"
  ],
  "constraints": [
    "k == lists.length",
    "0 <= k <= 10^4"
  ],
  "optimalTime": "O(N log k)",
  "optimalSpace": "O(k)",
  "hints": [
    "Hint 1: Comparing every node is slow. Can we use a Priority Queue?"
  ],
  "solutionCode": "class Solution { ... }"
}`;

export default function ProblemModal({ isOpen, onClose, activeProblem, onSetProblem, onClearProblem }: ProblemModalProps) {
  const { isInterviewer } = useUserStore() as any;
  const [activeTab, setActiveTab] = useState<'problem' | 'solution'>('problem');
  const [jsonInput, setJsonInput] = useState('');
  const [jsonError, setJsonError] = useState('');

  if (!isOpen) return null;

  const handleInjectJson = () => {
    try {
      setJsonError('');
      const parsed = JSON.parse(jsonInput);
      
      // Basic validation
      if (!parsed.title || !parsed.description) {
        throw new Error("JSON must include at least a 'title' and 'description' field.");
      }
      
      onSetProblem(parsed);
      setJsonInput('');
    } catch (err: any) {
      setJsonError(err.message || "Invalid JSON Format. Please check your syntax.");
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-3xl bg-[#0a0a0c] border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[85vh]">
          
          {/* Header */}
          <div className="h-16 shrink-0 bg-white/[0.03] border-b border-white/5 flex items-center justify-between px-6">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" />
                <h2 className="text-lg font-bold text-white tracking-wide">
                  {activeProblem ? activeProblem.title : 'Interview Prompt'}
                </h2>
              </div>
              {activeProblem && activeProblem.difficulty && (
                <span className="px-3 py-1 text-xs font-bold uppercase tracking-widest bg-white/5 text-white/70 rounded-full border border-white/10">
                  {activeProblem.difficulty}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-4">
              {activeProblem && isInterviewer && (
                <div className="flex items-center bg-black/50 rounded-xl border border-white/10 p-1">
                  <button onClick={() => setActiveTab('problem')} className={`px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded-lg transition-all ${activeTab === 'problem' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/80'}`}>Prompt</button>
                  <button onClick={() => setActiveTab('solution')} className={`px-4 py-1.5 text-xs font-bold uppercase tracking-widest rounded-lg transition-all flex items-center gap-2 ${activeTab === 'solution' ? 'bg-purple-500/20 text-purple-300' : 'text-white/40 hover:text-white/80'}`}>
                    <Lock className="w-3 h-3" /> Guide
                  </button>
                </div>
              )}
              
              {activeProblem && isInterviewer && (
                <button onClick={onClearProblem} className="flex items-center gap-2 px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-lg text-xs font-bold uppercase tracking-widest transition-all">
                  <RotateCcw className="w-3 h-3" /> Change
                </button>
              )}

              <button onClick={onClose} className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-xl transition-colors"><X className="w-5 h-5" /></button>
            </div>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-8 font-sans text-white/80">
            
            {!activeProblem ? (
              /* NO PROBLEM SET YET */
              isInterviewer ? (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-white mb-2">Inject Custom DSA Prompt (JSON)</h3>
                  <p className="text-xs text-white/50 mb-4">Paste your curated question JSON below. It will immediately broadcast to the interviewee.</p>
                  
                  {jsonError && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center gap-3 text-red-400 text-sm">
                      <AlertCircle className="w-5 h-5 shrink-0" /> {jsonError}
                    </div>
                  )}

                  <textarea 
                    value={jsonInput} onChange={(e) => setJsonInput(e.target.value)}
                    placeholder={JSON_TEMPLATE}
                    className="w-full h-64 bg-[#050505] border border-white/10 rounded-xl p-4 text-sm font-mono text-blue-300/80 outline-none focus:border-blue-500/50 resize-none placeholder:text-white/20"
                  />
                  <button onClick={handleInjectJson} className="w-full flex items-center justify-center gap-2 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl transition-colors">
                    <CheckCircle2 className="w-5 h-5" /> Broadcast Problem to Peer
                  </button>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                  <Lock className="w-12 h-12 mb-4" />
                  <h3 className="text-xl font-bold mb-2">Awaiting Interviewer</h3>
                  <p className="text-sm">The interviewer is currently selecting and configuring your problem...</p>
                </div>
              )
            ) : (
              /* PROBLEM IS SET */
              activeTab === 'problem' ? (
                <div className="space-y-8">
                  <div>
                    <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">Description</h3>
                    <p className="text-[15px] leading-relaxed whitespace-pre-wrap">{activeProblem.description}</p>
                  </div>
                  
                 {activeProblem.examples && activeProblem.examples.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">Examples</h3>
                      <div className="space-y-3">
                        {activeProblem.examples.map((ex: any, i: number) => {
                          // 🚀 FIX: Safely handle if the user pastes an object instead of a string
                          const displayString = typeof ex === 'string' ? ex : JSON.stringify(ex, null, 2);
                          return (
                            <pre key={i} className="bg-white/5 border border-white/10 p-4 rounded-xl text-sm font-mono text-blue-300/80 whitespace-pre-wrap">
                              {displayString}
                            </pre>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {activeProblem.constraints && activeProblem.constraints.length > 0 && (
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3">Constraints</h3>
                      <ul className="list-disc list-inside space-y-1 text-sm font-mono text-emerald-300/70">
                        {activeProblem.constraints.map((c: any, i: number) => {
                           // 🚀 FIX: Safely stringify objects in constraints too
                           const displayString = typeof c === 'string' ? c : JSON.stringify(c);
                           return <li key={i}>{displayString}</li>;
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              ) : (
                /* INTERVIEWER ONLY GUIDE */
                <div className="space-y-8">
                  <div className="bg-purple-500/10 border border-purple-500/20 p-5 rounded-2xl flex items-start gap-4">
                    <Lightbulb className="w-6 h-6 text-purple-400 shrink-0 mt-1" />
                    <div className="w-full">
                      <h3 className="text-sm font-bold text-purple-300 mb-1">Interviewer Guide</h3>
                      <p className="text-xs text-purple-300/70 leading-relaxed mb-4">Do not share this directly with the candidate. Guide them towards the optimal solution using the hints below.</p>
                      <div className="flex gap-6 mb-4">
                        <div><span className="text-xs font-bold uppercase text-white/40">Expected Time:</span> <span className="text-sm font-mono text-white ml-2">{activeProblem.optimalTime || 'N/A'}</span></div>
                        <div><span className="text-xs font-bold uppercase text-white/40">Expected Space:</span> <span className="text-sm font-mono text-white ml-2">{activeProblem.optimalSpace || 'N/A'}</span></div>
                      </div>
                      {activeProblem.hints && activeProblem.hints.length > 0 && (
                        <ul className="space-y-2 text-sm text-white/80">
                          {activeProblem.hints.map((h: string, i: number) => <li key={i}>• {h}</li>)}
                        </ul>
                      )}
                    </div>
                  </div>

                  {activeProblem.solutionCode && (
                    <div>
                      <h3 className="text-xs font-bold uppercase tracking-widest text-white/40 mb-3 flex items-center gap-2"><Code2 className="w-4 h-4" /> Optimal Solution Code</h3>
                      <pre className="bg-[#050505] border border-white/10 p-5 rounded-xl text-sm font-mono text-emerald-400/90 overflow-x-auto">
                        {activeProblem.solutionCode}
                      </pre>
                    </div>
                  )}
                </div>
              )
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}