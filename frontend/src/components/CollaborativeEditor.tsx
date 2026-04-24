'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { MonacoBinding } from 'y-monaco';
import {
  Play, Loader2, TerminalSquare, FileText,
  FileCode2, Lock, Lightbulb, RotateCcw,
} from 'lucide-react';
import { useUserStore } from '../store/useUserStore';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';

const CODING_CATEGORIES = [
  'Data Structures & Algorithms',
  'System Design',
  'Frontend (React/Next.js)',
  'Backend (Node/Express)',
  'Full Stack (MERN)',
];

const JSON_TEMPLATE = `{
  "title": "Merge Lists",
  "difficulty": "Hard",
  "description": "Given an array...",
  "examples": ["Input: [[1]] Output: [1]"],
  "constraints": ["k == lists.length"],
  "optimalTime": "O(N log k)",
  "optimalSpace": "O(k)",
  "hints": ["Use a Priority Queue"],
  "solutionCode": "class Solution {}"
}`;

const BOILERPLATES: Record<string, string> = {
  javascript: '// Write your optimized logic here...\n\nfunction solve() {\n  console.log("Hello from JavaScript!");\n}\nsolve();\n',
  python:     '# Write your optimized Python logic here...\n\ndef solve():\n    print("Hello from Python!")\nsolve()\n',
  java:       '// Write your Java solution here...\n\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello from Java!");\n    }\n}\n',
  cpp:        '#include <iostream>\n\nint main() {\n    std::cout << "Hello from C++!" << std::endl;\n    return 0;\n}\n',
};

interface Props { roomId: string; }

export default function CollaborativeEditor({ roomId }: Props) {
  const { editorCode, editorLanguage, setEditorCode, setEditorLanguage, isInterviewer } =
    useUserStore() as any;

  const [isHydrated,    setIsHydrated]    = useState(false);
  const [isFaangMode,   setIsFaangMode]   = useState(false);
  const [isRunning,     setIsRunning]     = useState(false);
  const [output,        setOutput]        = useState('// Console output will appear here...');
  const [isError,       setIsError]       = useState(false);
  const [roomCategory,  setRoomCategory]  = useState('');
  const [activeProblem, setActiveProblem] = useState<any>(null);
  const [activeTab,     setActiveTab]     = useState<'problem' | 'solution'>('problem');
  const [jsonInput,     setJsonInput]     = useState('');

  // ── Yjs / Monaco refs ─────────────────────────────────────────────────────
  const ydocRef        = useRef<Y.Doc | null>(null);
  const providerRef    = useRef<WebrtcProvider | null>(null);
  const bindingRef     = useRef<MonacoBinding | null>(null);
  const fallbackTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Hydration + local-storage restore ────────────────────────────────────
  useEffect(() => {
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rooms/${roomId}`)
      .then(r => r.json())
      .then(d => setRoomCategory(d.category))
      .catch(() => {});

    const savedCode    = localStorage.getItem(`code_${roomId}`);
    const savedLang    = localStorage.getItem(`lang_${roomId}`);
    const savedOutput  = localStorage.getItem(`output_${roomId}`);
    const savedProblem = localStorage.getItem(`problem_${roomId}`);

    if (savedCode && savedLang) {
      setEditorLanguage(savedLang);
      setEditorCode(savedCode);
      if (savedOutput) setOutput(savedOutput);
    } else {
      setEditorLanguage('javascript');
      setEditorCode(BOILERPLATES['javascript']);
    }

    if (savedProblem) {
      try { setActiveProblem(JSON.parse(savedProblem)); } catch {}
    }

    setIsHydrated(true);
  }, [roomId, setEditorCode, setEditorLanguage]);

  // ── Yjs teardown on unmount ───────────────────────────────────────────────
  useEffect(() => {
    return () => {
      if (fallbackTimer.current) clearTimeout(fallbackTimer.current);
      try { bindingRef.current?.destroy(); }   catch {}
      try { providerRef.current?.disconnect(); } catch {}
      try { ydocRef.current?.destroy(); }       catch {}
      bindingRef.current  = null;
      providerRef.current = null;
      ydocRef.current     = null;
    };
  }, []);

  // ── Attempt to restore saved code into a fresh (empty) Yjs document ──────
  const restoreCodeIfEmpty = useCallback((ytext: Y.Text, ydoc: Y.Doc) => {
    if (ytext.length > 0) return;            // peers already seeded content
    const saved = localStorage.getItem(`code_${roomId}`);
    if (!saved) return;
    ydoc.transact(() => {
      if (ytext.length === 0) ytext.insert(0, saved); // double-check inside tx
    });
  }, [roomId]);

  // ── Monaco mount: wire up Yjs ─────────────────────────────────────────────
  const handleEditorDidMount = useCallback((editor: any) => {
    // Tear down any previous Yjs session (e.g. HMR / Strict Mode double-mount)
    try { bindingRef.current?.destroy(); }    catch {}
    try { providerRef.current?.disconnect(); } catch {}
    try { ydocRef.current?.destroy(); }       catch {}
    if (fallbackTimer.current) clearTimeout(fallbackTimer.current);

    const ydoc     = new Y.Doc();
    const provider = new WebrtcProvider(`peer-room-${roomId}`, ydoc, {
      signaling: [
        'wss://signaling.yjs.dev',
        'wss://y-webrtc-signaling-eu.herokuapp.com',
      ],
    });
    const ytext   = ydoc.getText('monaco');
    const binding = new MonacoBinding(
      ytext,
      editor.getModel()!,
      new Set([editor]),
      provider.awareness,
    );

    ydocRef.current     = ydoc;
    providerRef.current = provider;
    bindingRef.current  = binding;

    /**
     * FIX — Code restoration after reload:
     *
     * Root cause: MonacoBinding immediately overwrites the Monaco model with
     * the content of Y.Text.  On a fresh page load Y.Text is empty, so the
     * editor is blanked.  localStorage still has the code, but the earlier
     * editor.setValue() call is silently discarded by the binding.
     *
     * Strategy:
     * 1. Listen for the WebRTC 'synced' event.  If peers are online they will
     *    push their Y.Text content; we only inject from localStorage when the
     *    document is *still* empty after sync (no peer was online).
     * 2. Fallback timer (2.5 s) covers the case where the 'synced' event fires
     *    before the provider has had a chance to exchange state, or doesn't
     *    fire at all (no peers / signaling outage).
     */
    const onSynced = () => restoreCodeIfEmpty(ytext, ydoc);
    provider.on('synced', onSynced);

    fallbackTimer.current = setTimeout(() => {
      restoreCodeIfEmpty(ytext, ydoc);
    }, 2500);

    // ── Shared problem state (broadcast from interviewer) ─────────────────
    const sharedState = ydoc.getMap('state');
    sharedState.observe(() => {
      const p = sharedState.get('problemData');
      if (p !== undefined) {
        setActiveProblem(p);
        localStorage.setItem(`problem_${roomId}`, JSON.stringify(p));
      }
    });
  }, [roomId, restoreCodeIfEmpty]);

  // ── Editor onChange ───────────────────────────────────────────────────────
  const handleCodeChange = useCallback((val: string | undefined) => {
    if (!isHydrated) return;
    const safeVal = val ?? '';
    setEditorCode(safeVal);
    localStorage.setItem(`code_${roomId}`, safeVal);
  }, [isHydrated, roomId, setEditorCode]);

  // ── Language selector ─────────────────────────────────────────────────────
  const handleLanguageChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value;
    setEditorLanguage(newLang);
    const boilerplate = BOILERPLATES[newLang] || '';
    setEditorCode(boilerplate);
    localStorage.setItem(`lang_${roomId}`, newLang);
    localStorage.setItem(`code_${roomId}`, boilerplate);

    // Sync language change into the shared Yjs doc so both peers see it
    if (ydocRef.current) {
      const ytext = ydocRef.current.getText('monaco');
      ydocRef.current.transact(() => {
        ytext.delete(0, ytext.length);
        ytext.insert(0, boilerplate);
      });
    }
  }, [roomId, setEditorCode, setEditorLanguage]);

  // ── JSON problem injection (interviewer only) ─────────────────────────────
  const handleInjectJson = useCallback(() => {
    try {
      const parsed = JSON.parse(jsonInput);
      setActiveProblem(parsed);
      ydocRef.current?.getMap('state').set('problemData', parsed);
      localStorage.setItem(`problem_${roomId}`, JSON.stringify(parsed));
      setJsonInput('');
    } catch {
      alert('Invalid JSON format. Please check your input.');
    }
  }, [jsonInput, roomId]);

  // ── Code execution ────────────────────────────────────────────────────────
  const runCode = useCallback(async () => {
    if (!editorCode.trim() || isFaangMode || isRunning) return;
    setIsRunning(true);
    setOutput('Compiling…');
    setIsError(false);
    try {
      const res  = await fetch('/api/execute', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ code: editorCode, language: editorLanguage }),
      });
      const data = JSON.parse(await res.text());
      const newOutput = data.run ? data.run.output : data.error || 'Execution failed.';
      setOutput(newOutput);
      localStorage.setItem(`output_${roomId}`, newOutput);
      setIsError(!res.ok || (data.run && data.run.code !== 0));
    } catch {
      setOutput('Connection failed. Check the execution server.');
      setIsError(true);
    } finally {
      setIsRunning(false);
    }
  }, [editorCode, editorLanguage, isFaangMode, isRunning, roomId]);

  if (!isHydrated) {
    return <div className="w-full h-full bg-[#0a0a0c] animate-pulse border border-white/5 rounded-2xl" />;
  }

  // ── Right panel: editor + console ─────────────────────────────────────────
  const EditorPane = (
    <div className="flex flex-col h-full w-full bg-[#0a0a0c]">

      {/* Toolbar */}
      <div className="h-14 shrink-0 border-b border-white/5 flex items-center justify-between px-5 bg-white/[0.02]">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsFaangMode(v => !v)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-colors border ${
              isFaangMode
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
            }`}
          >
            {isFaangMode ? <FileText className="w-4 h-4" /> : <FileCode2 className="w-4 h-4" />}
            {isFaangMode ? 'Docs Mode' : 'IDE Mode'}
          </button>

          <select
            value={editorLanguage}
            onChange={handleLanguageChange}
            disabled={isFaangMode}
            className="bg-transparent text-white/80 text-sm font-semibold outline-none cursor-pointer border-l border-white/10 pl-3 disabled:opacity-40"
          >
            <option className="bg-black" value="javascript">JavaScript</option>
            <option className="bg-black" value="python">Python</option>
            <option className="bg-black" value="java">Java</option>
            <option className="bg-black" value="cpp">C++</option>
          </select>
        </div>

        {CODING_CATEGORIES.includes(roomCategory) && (
          <button
            onClick={runCode}
            disabled={isRunning || isFaangMode}
            className="flex items-center gap-2 px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold uppercase disabled:opacity-50 transition-all shadow-lg"
          >
            {isRunning
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <Play className="w-4 h-4 fill-current" />}
            Run Code
          </button>
        )}
      </div>

      {/* Editor + Console */}
      <div className="flex-1 w-full min-h-0">
        <ResizablePanelGroup className="h-full w-full">
          <ResizablePanel
            defaultSize={70}
            minSize={30}
            className={`relative pt-4 ${isFaangMode ? 'bg-[#fcfcfc]' : 'bg-transparent'}`}
          >
            <Editor
              height="100%"
              width="100%"
              language={isFaangMode ? 'plaintext' : editorLanguage}
              theme={isFaangMode ? 'light' : 'vs-dark'}
              value={editorCode}
              onChange={handleCodeChange}
              onMount={handleEditorDidMount}
              options={{
                minimap:             { enabled: false },
                fontSize:            15,
                fontFamily:          isFaangMode ? 'Inter' : 'JetBrains Mono',
                scrollBeyondLastLine: false,
                wordWrap:            'on',
              }}
            />
          </ResizablePanel>

          {!isFaangMode && (
            <>
              <ResizableHandle className="h-1 bg-white/10 hover:bg-blue-500/50 transition-colors cursor-row-resize" />
              <ResizablePanel defaultSize={30} minSize={10} className="bg-[#020202] flex flex-col">
                <div className="h-10 shrink-0 border-b border-white/5 flex items-center px-5 bg-white/[0.01]">
                  <TerminalSquare className="w-4 h-4 text-white/40 mr-2" />
                  <span className="text-xs font-bold text-white/40 uppercase tracking-widest">Console</span>
                </div>
                <div className="flex-1 p-5 overflow-y-auto font-mono text-[13px] leading-relaxed">
                  <pre className={isError ? 'text-red-400' : 'text-emerald-400'}>{output}</pre>
                </div>
              </ResizablePanel>
            </>
          )}
        </ResizablePanelGroup>
      </div>
    </div>
  );

  // Non-DSA: just show the editor pane
  if (!CODING_CATEGORIES.includes(roomCategory)) {
    return (
      <div className="h-full w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
        {EditorPane}
      </div>
    );
  }

  // ── DSA LeetCode-style split view ─────────────────────────────────────────
  return (
    <div className="h-full w-full flex rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#0a0a0c]">
      <ResizablePanelGroup className="h-full w-full">

        {/* LEFT: Problem statement */}
        <ResizablePanel defaultSize={45} minSize={25} className="bg-[#050505] flex flex-col min-h-0 border-r border-white/5">
          <div className="h-14 shrink-0 border-b border-white/5 flex items-center justify-between px-6 bg-white/[0.02]">
            <span className="text-sm font-bold text-white/90 truncate">
              {activeProblem ? activeProblem.title : 'Interview Prompt'}
            </span>

            {isInterviewer && activeProblem && (
              <div className="flex gap-2">
                <button
                  onClick={() => setActiveTab('problem')}
                  className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg transition-colors ${
                    activeTab === 'problem' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/80'
                  }`}
                >
                  Prompt
                </button>
                <button
                  onClick={() => setActiveTab('solution')}
                  className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors ${
                    activeTab === 'solution' ? 'bg-purple-500/20 text-purple-300' : 'text-white/40 hover:text-white/80'
                  }`}
                >
                  <Lock className="w-3 h-3" /> Guide
                </button>
                <button
                  onClick={() => {
                    setActiveProblem(null);
                    ydocRef.current?.getMap('state').delete('problemData');
                    localStorage.removeItem(`problem_${roomId}`);
                  }}
                  className="text-red-400 p-1.5 hover:bg-red-500/10 rounded-lg transition-colors"
                  title="Clear Problem"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10">
            {!activeProblem ? (
              isInterviewer ? (
                <div className="space-y-4">
                  <h3 className="text-[10px] font-bold text-white/50 uppercase tracking-widest">
                    Inject JSON Prompt
                  </h3>
                  <textarea
                    value={jsonInput}
                    onChange={e => setJsonInput(e.target.value)}
                    placeholder={JSON_TEMPLATE}
                    className="w-full h-64 bg-black border border-white/10 rounded-xl p-4 text-xs font-mono text-blue-300/80 outline-none resize-none placeholder:text-white/20"
                  />
                  <button
                    onClick={handleInjectJson}
                    className="w-full py-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all"
                  >
                    Broadcast to Peer
                  </button>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-40">
                  <Lock className="w-8 h-8 mb-4" />
                  <p className="text-sm font-semibold">Awaiting Interviewer…</p>
                </div>
              )
            ) : activeTab === 'problem' ? (
              <div className="space-y-6 text-white/80">
                <div>
                  <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Description</h3>
                  <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{activeProblem.description}</p>
                </div>
                {activeProblem.examples?.length > 0 && (
                  <div>
                    <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Examples</h3>
                    {activeProblem.examples.map((ex: any, i: number) => (
                      <pre key={i} className="bg-black/50 border border-white/5 p-4 rounded-xl text-[13px] font-mono text-blue-300/80 whitespace-pre-wrap mb-3">
                        {typeof ex === 'string' ? ex : JSON.stringify(ex, null, 2)}
                      </pre>
                    ))}
                  </div>
                )}
                {activeProblem.constraints?.length > 0 && (
                  <div>
                    <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Constraints</h3>
                    <ul className="list-disc pl-5 text-[13px] font-mono text-emerald-300/80 space-y-1">
                      {activeProblem.constraints.map((c: any, i: number) => (
                        <li key={i}>{typeof c === 'string' ? c : JSON.stringify(c)}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-purple-500/5 p-5 rounded-2xl border border-purple-500/10">
                  <h3 className="text-xs font-bold text-purple-300 mb-3 flex items-center gap-2">
                    <Lightbulb className="w-5 h-5" /> Interviewer Guide
                  </h3>
                  {activeProblem.hints?.map((h: string, i: number) => (
                    <p key={i} className="text-sm text-white/80 mb-2 leading-relaxed">• {h}</p>
                  ))}
                  {activeProblem.optimalTime && (
                    <p className="text-xs text-white/50 mt-3">
                      Time: <span className="text-emerald-400">{activeProblem.optimalTime}</span>
                      {' · '}
                      Space: <span className="text-emerald-400">{activeProblem.optimalSpace}</span>
                    </p>
                  )}
                </div>
                {activeProblem.solutionCode && (
                  <div>
                    <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Reference Solution</h3>
                    <pre className="bg-black/50 border border-white/5 p-5 rounded-xl text-xs font-mono text-emerald-400 overflow-x-auto">
                      {activeProblem.solutionCode}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>
        </ResizablePanel>

        <ResizableHandle className="w-1 bg-white/10 hover:bg-blue-500/50 transition-colors z-10 cursor-col-resize" />

        {/* RIGHT: Editor + Console */}
        <ResizablePanel defaultSize={55} minSize={30} className="h-full min-h-0">
          {EditorPane}
        </ResizablePanel>

      </ResizablePanelGroup>
    </div>
  );
}







// 'use client';

// import { useState, useEffect, useRef } from 'react';
// import Editor, { useMonaco } from '@monaco-editor/react';
// import * as Y from 'yjs';
// import { WebrtcProvider } from 'y-webrtc';
// import { MonacoBinding } from 'y-monaco';
// import { Play, Loader2, TerminalSquare, FileText, FileCode2, Lock, Lightbulb, RotateCcw } from 'lucide-react';
// import { useUserStore } from '../store/useUserStore';
// import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";

// const CODING_CATEGORIES = ["Data Structures & Algorithms", "System Design", "Frontend (React/Next.js)", "Backend (Node/Express)", "Full Stack (MERN)"];
// const JSON_TEMPLATE = `{"title": "Merge Lists", "difficulty": "Hard", "description": "Given an array...", "examples": ["Input: [[1]] Output: [1]"], "constraints": ["k == lists.length"], "optimalTime": "O(N log k)", "optimalSpace": "O(k)", "hints": ["Use PQ"], "solutionCode": "class Solution {}"}`;

// const BOILERPLATES: Record<string, string> = {
//   javascript: '// Write your optimized logic here...\n\nfunction solve() {\n  console.log("Hello from JavaScript!");\n}\nsolve();\n',
//   python: '# Write your optimized Python logic here...\n\ndef solve():\n    print("Hello from Python!")\nsolve()\n',
//   java: '// Write your Java solution here...\n\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello from Java!");\n    }\n}\n',
//   cpp: '#include <iostream>\n\nint main() {\n    std::cout << "Hello from C++!" << std::endl;\n    return 0;\n}\n',
// };

// export default function CollaborativeEditor({ roomId }: { roomId: string }) {
//   const { editorCode, editorLanguage, setEditorCode, setEditorLanguage, isInterviewer } = useUserStore() as any;
//   const [isHydrated, setIsHydrated] = useState(false);
//   const [isFaangMode, setIsFaangMode] = useState(false);
//   const [isRunning, setIsRunning] = useState(false);
//   const [output, setOutput] = useState('// Console output will appear here...');
//   const [isError, setIsError] = useState(false);

//   const ydocRef = useRef<Y.Doc | null>(null);
//   const [roomCategory, setRoomCategory] = useState('');
//   const [activeProblem, setActiveProblem] = useState<any>(null);
//   const [activeTab, setActiveTab] = useState<'problem' | 'solution'>('problem');
//   const [jsonInput, setJsonInput] = useState('');

//   // ─── 🚀 THE FIX: SMART INITIALIZATION & RECOVERY ───
//   useEffect(() => {
//     fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rooms/${roomId}`).then(r => r.json()).then(d => setRoomCategory(d.category)).catch(() => {});
    
//     const savedCode = localStorage.getItem(`code_${roomId}`);
//     const savedLang = localStorage.getItem(`lang_${roomId}`);
//     const savedOutput = localStorage.getItem(`output_${roomId}`);
//     const savedProblem = localStorage.getItem(`problem_${roomId}`);

//     if (savedCode && savedLang) {
//       setEditorLanguage(savedLang);
//       setEditorCode(savedCode);
//       if (savedOutput) setOutput(savedOutput);
//     } else {
//       setEditorLanguage('javascript');
//       setEditorCode(BOILERPLATES['javascript']);
//     }

//     if (savedProblem) setActiveProblem(JSON.parse(savedProblem));
//     setIsHydrated(true);
//   }, [roomId, setEditorCode, setEditorLanguage]);

//   const handleEditorDidMount = (editor: any) => {
//     // Force inject cache before Yjs takes over
//     const savedCode = localStorage.getItem(`code_${roomId}`);
//     if (savedCode) editor.setValue(savedCode);

//     const ydoc = new Y.Doc();
//     ydocRef.current = ydoc;
//     const provider = new WebrtcProvider(`peer-room-${roomId}`, ydoc, { signaling: ['wss://signaling.yjs.dev', 'wss://y-webrtc-signaling-eu.herokuapp.com'] });
//     new MonacoBinding(ydoc.getText('monaco'), editor.getModel(), new Set([editor]), provider.awareness);

//     const sharedState = ydoc.getMap('state');
//     sharedState.observe(() => {
//       const p = sharedState.get('problemData');
//       if (p !== undefined) { setActiveProblem(p); localStorage.setItem(`problem_${roomId}`, JSON.stringify(p)); }
//     });
//     return () => { provider.disconnect(); ydoc.destroy(); };
//   };

//   const handleCodeChange = (val: string | undefined) => {
//     if (!isHydrated) return;
//     const safeVal = val || '';
//     setEditorCode(safeVal);
//     localStorage.setItem(`code_${roomId}`, safeVal);
//   };

//   const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     const newLang = e.target.value;
//     setEditorLanguage(newLang);
//     setEditorCode(BOILERPLATES[newLang] || '');
//     localStorage.setItem(`lang_${roomId}`, newLang);
//   };

//   const handleInjectJson = () => {
//     try {
//       const parsed = JSON.parse(jsonInput);
//       setActiveProblem(parsed);
//       ydocRef.current?.getMap('state').set('problemData', parsed);
//       localStorage.setItem(`problem_${roomId}`, JSON.stringify(parsed));
//       setJsonInput('');
//     } catch { alert("Invalid JSON Format"); }
//   };

//   const runCode = async () => {
//     if (!editorCode.trim() || isFaangMode) return;
//     setIsRunning(true); setOutput('Compiling...'); setIsError(false);
//     try {
//       const res = await fetch('http://localhost:3000/api/execute', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: editorCode, language: editorLanguage }) });
//       const data = JSON.parse(await res.text());
//       const newOutput = data.run ? data.run.output : data.error || 'Execution failed.';
//       setOutput(newOutput);
//       localStorage.setItem(`output_${roomId}`, newOutput);
//       setIsError(!res.ok || (data.run && data.run.code !== 0));
//     } catch { setOutput('Connection failed.'); setIsError(true); } finally { setIsRunning(false); }
//   };

//   if (!isHydrated) return <div className="w-full h-full bg-[#0a0a0c] animate-pulse border border-white/5 rounded-2xl" />;

//   // ─── RIGHT HALF: EDITOR & CONSOLE ───
//   const EditorPane = (
//     <div className="flex flex-col h-full w-full bg-[#0a0a0c]">
//       <div className="h-14 shrink-0 border-b border-white/5 flex items-center justify-between px-5 bg-white/[0.02]">
//         <div className="flex items-center gap-3">
//           <button onClick={() => setIsFaangMode(!isFaangMode)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-colors border ${isFaangMode ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'}`}>
//             {isFaangMode ? <FileText className="w-4 h-4"/> : <FileCode2 className="w-4 h-4"/>} {isFaangMode ? "Docs Mode" : "IDE Mode"}
//           </button>
//           <select value={editorLanguage} onChange={handleLanguageChange} disabled={isFaangMode} className="bg-transparent text-white/80 text-sm font-semibold outline-none cursor-pointer border-l border-white/10 pl-3">
//             <option className="bg-black" value="javascript">JavaScript</option><option className="bg-black" value="python">Python</option><option className="bg-black" value="java">Java</option><option className="bg-black" value="cpp">C++</option>
//           </select>
//         </div>
//         {CODING_CATEGORIES.includes(roomCategory) && (
//           <button onClick={runCode} disabled={isRunning || isFaangMode} className="flex items-center gap-2 px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold uppercase disabled:opacity-50 transition-all shadow-lg">
//             {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-current" />} Run Code
//           </button>
//         )}
//       </div>

//       <div className="flex-1 w-full min-h-0">
//         <ResizablePanelGroup className="h-full w-full">
//           <ResizablePanel defaultSize={70} minSize={30} className={`relative pt-4 ${isFaangMode ? 'bg-[#fcfcfc]' : 'bg-transparent'}`}>
//             <Editor height="100%" width="100%" language={isFaangMode ? 'plaintext' : editorLanguage} theme={isFaangMode ? 'light' : 'vs-dark'} value={editorCode} onChange={handleCodeChange} onMount={handleEditorDidMount} options={{ minimap: { enabled: false }, fontSize: 15, fontFamily: isFaangMode ? 'Inter' : 'JetBrains Mono', scrollBeyondLastLine: false }} />
//           </ResizablePanel>
          
//           {!isFaangMode && (
//             <>
//               <ResizableHandle className="h-1 bg-white/10 hover:bg-blue-500/50 transition-colors cursor-row-resize" />
//               <ResizablePanel defaultSize={30} minSize={10} className="bg-[#020202] flex flex-col">
//                 <div className="h-10 shrink-0 border-b border-white/5 flex items-center px-5 bg-white/[0.01]">
//                   <TerminalSquare className="w-4 h-4 text-white/40 mr-2" /><span className="text-xs font-bold text-white/40 uppercase tracking-widest">Console</span>
//                 </div>
//                 <div className="flex-1 p-5 overflow-y-auto font-mono text-[13px] leading-relaxed"><pre className={isError ? 'text-red-400' : 'text-emerald-400'}>{output}</pre></div>
//               </ResizablePanel>
//             </>
//           )}
//         </ResizablePanelGroup>
//       </div>
//     </div>
//   );

//   if (!CODING_CATEGORIES.includes(roomCategory)) return <div className="h-full w-full rounded-2xl overflow-hidden border border-white/10 shadow-2xl">{EditorPane}</div>;

//   // ─── LEETCODE SPLIT VIEW (DSA Mode) ───
//   return (
//     <div className="h-full w-full flex rounded-2xl overflow-hidden border border-white/10 shadow-2xl bg-[#0a0a0c]">
//       <ResizablePanelGroup  className="h-full w-full">
        
//         {/* LEFT HALF: Problem Statement */}
//         <ResizablePanel defaultSize={45} minSize={25} className="bg-[#050505] flex flex-col min-h-0 border-r border-white/5">
//           <div className="h-14 shrink-0 border-b border-white/5 flex items-center justify-between px-6 bg-white/[0.02]">
//             <span className="text-sm font-bold text-white/90 truncate">{activeProblem ? activeProblem.title : 'Interview Prompt'}</span>
//             {isInterviewer && activeProblem && (
//               <div className="flex gap-2">
//                 <button onClick={() => setActiveTab('problem')} className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg transition-colors ${activeTab === 'problem' ? 'bg-white/10 text-white' : 'text-white/40 hover:text-white/80'}`}>Prompt</button>
//                 <button onClick={() => setActiveTab('solution')} className={`text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors ${activeTab === 'solution' ? 'bg-purple-500/20 text-purple-300' : 'text-white/40 hover:text-white/80'}`}><Lock className="w-3 h-3"/> Guide</button>
//                 <button onClick={() => {setActiveProblem(null); localStorage.removeItem(`problem_${roomId}`);}} className="text-red-400 p-1.5 hover:bg-red-500/10 rounded-lg transition-colors" title="Clear Problem"><RotateCcw className="w-4 h-4" /></button>
//               </div>
//             )}
//           </div>
          
//           <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10">
//             {!activeProblem ? (
//               isInterviewer ? (
//                 <div className="space-y-4">
//                   <h3 className="text-[10px] font-bold text-white/50 uppercase tracking-widest">Inject JSON Prompt</h3>
//                   <textarea value={jsonInput} onChange={e => setJsonInput(e.target.value)} placeholder={JSON_TEMPLATE} className="w-full h-64 bg-black border border-white/10 rounded-xl p-4 text-xs font-mono text-blue-300/80 outline-none resize-none placeholder:text-white/20" />
//                   <button onClick={handleInjectJson} className="w-full py-3 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30 text-[10px] font-bold uppercase tracking-widest rounded-xl transition-all">Broadcast to Peer</button>
//                 </div>
//               ) : <div className="h-full flex flex-col items-center justify-center opacity-40"><Lock className="w-8 h-8 mb-4" /><p className="text-sm font-semibold">Awaiting Interviewer...</p></div>
//             ) : activeTab === 'problem' ? (
//                 <div className="space-y-6 text-white/80">
//                   <div><h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Description</h3><p className="text-[14px] leading-relaxed whitespace-pre-wrap">{activeProblem.description}</p></div>
//                   {activeProblem.examples && <div><h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Examples</h3>{activeProblem.examples.map((ex: any, i: number) => <pre key={i} className="bg-black/50 border border-white/5 p-4 rounded-xl text-[13px] font-mono text-blue-300/80 whitespace-pre-wrap mb-3">{typeof ex === 'string' ? ex : JSON.stringify(ex, null, 2)}</pre>)}</div>}
//                   {activeProblem.constraints && <div><h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Constraints</h3><ul className="list-disc pl-5 text-[13px] font-mono text-emerald-300/80 space-y-1">{activeProblem.constraints.map((c: any, i: number) => <li key={i}>{typeof c === 'string' ? c : JSON.stringify(c)}</li>)}</ul></div>}
//                 </div>
//             ) : (
//                 <div className="space-y-6">
//                   <div className="bg-purple-500/5 p-5 rounded-2xl border border-purple-500/10"><h3 className="text-xs font-bold text-purple-300 mb-3 flex items-center gap-2"><Lightbulb className="w-5 h-5"/> Interviewer Guide</h3>{activeProblem.hints?.map((h:string,i:number)=><p key={i} className="text-sm text-white/80 mb-2 leading-relaxed">• {h}</p>)}</div>
//                   {activeProblem.solutionCode && <div><h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-2">Code</h3><pre className="bg-black/50 border border-white/5 p-5 rounded-xl text-xs font-mono text-emerald-400 overflow-x-auto">{activeProblem.solutionCode}</pre></div>}
//                 </div>
//             )}
//           </div>
//         </ResizablePanel>
        
//         {/* Resize Handle */}
//         <ResizableHandle className="w-1 bg-white/10 hover:bg-blue-500/50 transition-colors z-10 cursor-col-resize" />
        
//         {/* RIGHT HALF: Editor & Console */}
//         <ResizablePanel defaultSize={55} minSize={30} className="h-full min-h-0">
//           {EditorPane}
//         </ResizablePanel>
        
//       </ResizablePanelGroup>
//     </div>
//   );
// }





// 'use client';

// import { useState, useEffect, useRef, useCallback } from 'react';
// import Editor, { useMonaco } from '@monaco-editor/react';
// import * as Y from 'yjs';
// import { WebrtcProvider } from 'y-webrtc';
// import { MonacoBinding } from 'y-monaco';
// import { Play, Code2, Loader2, TerminalSquare, GripHorizontal, Users, FileText, FileCode2 } from 'lucide-react';
// import { useUserStore } from '../store/useUserStore';

// interface CollaborativeEditorProps {
//   roomId: string;
// }

// export default function CollaborativeEditor({ roomId }: CollaborativeEditorProps) {
//   const { editorCode, editorLanguage, setEditorCode, setEditorLanguage } = useUserStore() as any;
//   const [isMounted, setIsMounted] = useState(false);
  
//   // FAANG Mode State
//   const [isFaangMode, setIsFaangMode] = useState(false);
  
//   const [isRunning, setIsRunning] = useState(false);
//   const [output, setOutput] = useState<string>('// Shared execution output will appear here...');
//   const [isError, setIsError] = useState(false);

//   // Connection & Yjs Refs
//   const [connected, setConnected] = useState(false);
//   const [peersCount, setPeersCount] = useState(1);
//   const ydocRef = useRef<Y.Doc | null>(null);
//   const providerRef = useRef<WebrtcProvider | null>(null);

//   // Resizer State
//   const [terminalHeight, setTerminalHeight] = useState(150);
//   const [isDragging, setIsDragging] = useState(false);
//   const containerRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     setIsMounted(true);
//   }, []);

//   // ─── YJS COLLABORATION ENGINE ───
//   const handleEditorDidMount = (editor: any) => {
//     const ydoc = new Y.Doc();
//     ydocRef.current = ydoc;

//     const provider = new WebrtcProvider(`peer-room-${roomId}`, ydoc, {
//       signaling: ['wss://signaling.yjs.dev', 'wss://y-webrtc-signaling-eu.herokuapp.com']
//     });
//     providerRef.current = provider;

//     const ytext = ydoc.getText('monaco');
//     new MonacoBinding(ytext, editor.getModel(), new Set([editor]), provider.awareness);

//     // Sync UI State (Language, Terminal, Mode) across peers
//     const sharedState = ydoc.getMap('state');
    
//     sharedState.observe(() => {
//       const syncedLang = sharedState.get('language') as string;
//       const syncedOutput = sharedState.get('output') as string;
//       const syncedError = sharedState.get('isError') as boolean;
//       const syncedMode = sharedState.get('isFaangMode') as boolean;

//       if (syncedLang && syncedLang !== editorLanguage) setEditorLanguage(syncedLang);
//       if (syncedOutput !== undefined) setOutput(syncedOutput);
//       if (syncedError !== undefined) setIsError(syncedError);
//       if (syncedMode !== undefined) setIsFaangMode(syncedMode);
//     });

//     // 🚀 THE TS FIX: Destructure the object correctly instead of using a raw boolean
//     provider.on('synced', (status: { synced: boolean }) => {
//       setConnected(status.synced);
//     });

//     provider.awareness.on('change', () => {
//       setPeersCount(provider.awareness.getStates().size);
//     });

//     return () => {
//       provider.disconnect();
//       ydoc.destroy();
//     };
//   };

//   const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
//     const newLang = e.target.value;
//     setEditorLanguage(newLang);
//     ydocRef.current?.getMap('state').set('language', newLang);
//   };

//   const toggleFaangMode = () => {
//     const newMode = !isFaangMode;
//     setIsFaangMode(newMode);
//     ydocRef.current?.getMap('state').set('isFaangMode', newMode);
//   };

//   const broadcastOutput = (text: string, errorState: boolean = false) => {
//     setOutput(text);
//     setIsError(errorState);
//     ydocRef.current?.getMap('state').set('output', text);
//     ydocRef.current?.getMap('state').set('isError', errorState);
//   };

//   const runCode = async () => {
//     if (!editorCode.trim()) {
//       broadcastOutput('Error: Editor is empty.', true);
//       return;
//     }

//     setIsRunning(true);
//     broadcastOutput('Compiling and running on secure cloud server...', false);

//     if (terminalHeight < 100) setTerminalHeight(200);

//     try {
//       const response = await fetch('http://localhost:3000/api/execute', {
//         method: 'POST',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ code: editorCode, language: editorLanguage }),
//       });

//       const rawText = await response.text();
//       let data;
//       try { data = JSON.parse(rawText); } 
//       catch (err) {
//         broadcastOutput('Error: Server returned an invalid response.', true);
//         setIsRunning(false);
//         return;
//       }

//       if (!response.ok) {
//         broadcastOutput(data.error || 'Execution failed due to a server error.', true);
//         return;
//       }

//       if (data.run && data.run.code !== 0) {
//         broadcastOutput(data.run.output, true);
//       } else if (data.run) {
//         broadcastOutput(data.run.output || 'Code executed successfully.', false);
//       } else {
//         broadcastOutput('Unknown execution format received.', true);
//       }
//     } catch (error) {
//       broadcastOutput('Error: Failed to connect to the execution engine.', true);
//     } finally {
//       setIsRunning(false);
//     }
//   };

//   const handleMouseMove = useCallback((e: MouseEvent) => {
//     if (!isDragging || !containerRef.current) return;
//     const containerRect = containerRef.current.getBoundingClientRect();
//     const clampedHeight = Math.max(40, Math.min(containerRect.bottom - e.clientY, containerRect.height * 0.8));
//     setTerminalHeight(clampedHeight);
//   }, [isDragging]);

//   const handleMouseUp = useCallback(() => setIsDragging(false), []);

//   useEffect(() => {
//     if (isDragging) {
//       window.addEventListener('mousemove', handleMouseMove);
//       window.addEventListener('mouseup', handleMouseUp);
//       document.body.style.userSelect = 'none';
//     } else {
//       document.body.style.userSelect = '';
//     }
//     return () => {
//       window.removeEventListener('mousemove', handleMouseMove);
//       window.removeEventListener('mouseup', handleMouseUp);
//     };
//   }, [isDragging, handleMouseMove, handleMouseUp]);

//   if (!isMounted) return null;

//   return (
//     <div ref={containerRef} className="w-full h-full min-h-[400px] flex flex-col bg-[#0a0a0c] border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative z-10">
      
//       {/* ─── Header Toolbar ─── */}
//       <div className="h-16 shrink-0 bg-white/[0.03] border-b border-white/5 flex items-center justify-between px-6 z-20">
//         <div className="flex items-center gap-4">
//           <div className="flex items-center gap-3">
//             <Code2 className="w-5 h-5 text-blue-400" />
//             <span className="text-sm font-semibold text-white/80 tracking-wide">Workspace</span>
//           </div>

//           <div className="h-4 w-[1px] bg-white/10 mx-2" />

//           {/* Connection Status */}
//           <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
//             <Users className={`w-4 h-4 ${peersCount > 1 ? 'text-emerald-400' : 'text-white/40'}`} />
//             <span className="text-xs font-bold text-white/60">{peersCount} Active</span>
//             <div className={`w-2 h-2 rounded-full ml-2 ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
//           </div>
//         </div>
        
//         <div className="flex items-center gap-3">
//           <button 
//             onClick={toggleFaangMode}
//             className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border ${
//               isFaangMode 
//                 ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' 
//                 : 'bg-white/5 text-white/50 border-white/5 hover:bg-white/10 hover:text-white/80'
//             }`}
//           >
//             {isFaangMode ? <FileText className="w-4 h-4" /> : <FileCode2 className="w-4 h-4" />}
//             {isFaangMode ? 'FAANG Docs Mode' : 'IDE Mode'}
//           </button>

//           <select 
//             value={editorLanguage} onChange={handleLanguageChange} disabled={isFaangMode}
//             className={`bg-white/5 border border-white/10 text-white/80 text-sm rounded-xl px-4 py-2 outline-none focus:ring-1 focus:ring-blue-500/50 cursor-pointer ${isFaangMode ? 'opacity-50 cursor-not-allowed' : ''}`}
//           >
//             <option value="javascript">JavaScript</option>
//             <option value="typescript">TypeScript</option>
//             <option value="python">Python</option>
//             <option value="java">Java</option>
//             <option value="cpp">C++</option>
//           </select>
          
//           <button 
//             onClick={runCode} disabled={isRunning || isFaangMode}
//             className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all ${
//               isFaangMode || isRunning 
//                 ? 'bg-white/5 text-white/30 cursor-not-allowed' 
//                 : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]'
//             }`}
//           >
//             {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} 
//             Run
//           </button>
//         </div>
//       </div>

//       {/* ─── Editor Canvas ─── */}
//       <div className={`flex-1 w-full relative min-h-0 transition-colors duration-500 ${isFaangMode ? 'bg-[#fcfcfc]' : 'bg-[#0a0a0c]'} ${isDragging ? 'pointer-events-none' : ''}`}>
//         <div className="absolute inset-0">
//           <Editor
//             height="100%"
//             width="100%"
//             language={isFaangMode ? 'plaintext' : editorLanguage}
//             theme={isFaangMode ? 'light' : 'vs-dark'}
//             value={editorCode}
//             onChange={(value) => setEditorCode(value || '')}
//             onMount={handleEditorDidMount}
//             loading={
//               <div className="flex flex-col items-center justify-center h-full text-white/30 gap-3">
//                  <Loader2 className="w-6 h-6 animate-spin" />
//                  <span className="text-sm font-medium">Booting Collaboration Engine...</span>
//               </div>
//             }
//             options={{
//               minimap: { enabled: false },
//               fontSize: 15,
//               padding: { top: 32, bottom: 32 },
//               fontFamily: isFaangMode ? 'Inter, sans-serif' : 'JetBrains Mono, monospace',
//               lineNumbers: isFaangMode ? 'off' : 'on',
//               folding: !isFaangMode,
//               wordWrap: 'on',
//               renderLineHighlight: isFaangMode ? 'none' : 'all',
//               scrollBeyondLastLine: false,
//             }}
//           />
//         </div>
//       </div>

//       {/* ─── Resizer ─── */}
//       {!isFaangMode && (
//         <div 
//           onMouseDown={() => setIsDragging(true)}
//           className="h-2 w-full bg-white/[0.02] hover:bg-blue-500/50 cursor-row-resize flex items-center justify-center border-y border-white/5 transition-colors z-20"
//         >
//           <GripHorizontal className={`w-4 h-4 transition-colors ${isDragging ? 'text-blue-400' : 'text-white/20'}`} />
//         </div>
//       )}

//       {/* ─── Terminal ─── */}
//       {!isFaangMode && (
//         <div style={{ height: terminalHeight }} className="shrink-0 bg-[#050505] flex flex-col transition-none overflow-hidden">
//           <div className="h-10 shrink-0 bg-white/[0.02] border-b border-white/5 flex items-center px-6">
//             <div className="flex items-center gap-2 text-white/50">
//               <TerminalSquare className="w-4 h-4" />
//               <span className="text-xs font-bold tracking-wider uppercase">Shared Terminal</span>
//             </div>
//           </div>
//           <div className="flex-1 p-5 overflow-y-auto font-mono text-[13px] leading-relaxed">
//             <pre className={`whitespace-pre-wrap ${isError ? 'text-red-400' : 'text-emerald-400/90'}`}>
//               {output}
//             </pre>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }