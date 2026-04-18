'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Editor, { useMonaco } from '@monaco-editor/react';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { MonacoBinding } from 'y-monaco';
import { Play, Code2, Loader2, TerminalSquare, GripHorizontal, Users, FileText, FileCode2 } from 'lucide-react';
import { useUserStore } from '../store/useUserStore';

interface CollaborativeEditorProps {
  roomId: string;
}

export default function CollaborativeEditor({ roomId }: CollaborativeEditorProps) {
  const { editorCode, editorLanguage, setEditorCode, setEditorLanguage } = useUserStore() as any;
  const [isMounted, setIsMounted] = useState(false);
  
  // FAANG Mode State
  const [isFaangMode, setIsFaangMode] = useState(false);
  
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<string>('// Shared execution output will appear here...');
  const [isError, setIsError] = useState(false);

  // Connection & Yjs Refs
  const [connected, setConnected] = useState(false);
  const [peersCount, setPeersCount] = useState(1);
  const ydocRef = useRef<Y.Doc | null>(null);
  const providerRef = useRef<WebrtcProvider | null>(null);

  // Resizer State
  const [terminalHeight, setTerminalHeight] = useState(150);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ─── YJS COLLABORATION ENGINE ───
  const handleEditorDidMount = (editor: any) => {
    const ydoc = new Y.Doc();
    ydocRef.current = ydoc;

    const provider = new WebrtcProvider(`peer-room-${roomId}`, ydoc, {
      signaling: ['wss://signaling.yjs.dev', 'wss://y-webrtc-signaling-eu.herokuapp.com']
    });
    providerRef.current = provider;

    const ytext = ydoc.getText('monaco');
    new MonacoBinding(ytext, editor.getModel(), new Set([editor]), provider.awareness);

    // Sync UI State (Language, Terminal, Mode) across peers
    const sharedState = ydoc.getMap('state');
    
    sharedState.observe(() => {
      const syncedLang = sharedState.get('language') as string;
      const syncedOutput = sharedState.get('output') as string;
      const syncedError = sharedState.get('isError') as boolean;
      const syncedMode = sharedState.get('isFaangMode') as boolean;

      if (syncedLang && syncedLang !== editorLanguage) setEditorLanguage(syncedLang);
      if (syncedOutput !== undefined) setOutput(syncedOutput);
      if (syncedError !== undefined) setIsError(syncedError);
      if (syncedMode !== undefined) setIsFaangMode(syncedMode);
    });

    // 🚀 THE TS FIX: Destructure the object correctly instead of using a raw boolean
    provider.on('synced', (status: { synced: boolean }) => {
      setConnected(status.synced);
    });

    provider.awareness.on('change', () => {
      setPeersCount(provider.awareness.getStates().size);
    });

    return () => {
      provider.disconnect();
      ydoc.destroy();
    };
  };

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value;
    setEditorLanguage(newLang);
    ydocRef.current?.getMap('state').set('language', newLang);
  };

  const toggleFaangMode = () => {
    const newMode = !isFaangMode;
    setIsFaangMode(newMode);
    ydocRef.current?.getMap('state').set('isFaangMode', newMode);
  };

  const broadcastOutput = (text: string, errorState: boolean = false) => {
    setOutput(text);
    setIsError(errorState);
    ydocRef.current?.getMap('state').set('output', text);
    ydocRef.current?.getMap('state').set('isError', errorState);
  };

  const runCode = async () => {
    if (!editorCode.trim()) {
      broadcastOutput('Error: Editor is empty.', true);
      return;
    }

    setIsRunning(true);
    broadcastOutput('Compiling and running on secure cloud server...', false);

    if (terminalHeight < 100) setTerminalHeight(200);

    try {
      const response = await fetch('http://localhost:3000/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: editorCode, language: editorLanguage }),
      });

      const rawText = await response.text();
      let data;
      try { data = JSON.parse(rawText); } 
      catch (err) {
        broadcastOutput('Error: Server returned an invalid response.', true);
        setIsRunning(false);
        return;
      }

      if (!response.ok) {
        broadcastOutput(data.error || 'Execution failed due to a server error.', true);
        return;
      }

      if (data.run && data.run.code !== 0) {
        broadcastOutput(data.run.output, true);
      } else if (data.run) {
        broadcastOutput(data.run.output || 'Code executed successfully.', false);
      } else {
        broadcastOutput('Unknown execution format received.', true);
      }
    } catch (error) {
      broadcastOutput('Error: Failed to connect to the execution engine.', true);
    } finally {
      setIsRunning(false);
    }
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    const containerRect = containerRef.current.getBoundingClientRect();
    const clampedHeight = Math.max(40, Math.min(containerRect.bottom - e.clientY, containerRect.height * 0.8));
    setTerminalHeight(clampedHeight);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
    } else {
      document.body.style.userSelect = '';
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  if (!isMounted) return null;

  return (
    <div ref={containerRef} className="w-full h-full min-h-[400px] flex flex-col bg-[#0a0a0c] border border-white/10 rounded-3xl overflow-hidden shadow-2xl relative z-10">
      
      {/* ─── Header Toolbar ─── */}
      <div className="h-16 shrink-0 bg-white/[0.03] border-b border-white/5 flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3">
            <Code2 className="w-5 h-5 text-blue-400" />
            <span className="text-sm font-semibold text-white/80 tracking-wide">Workspace</span>
          </div>

          <div className="h-4 w-[1px] bg-white/10 mx-2" />

          {/* Connection Status */}
          <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
            <Users className={`w-4 h-4 ${peersCount > 1 ? 'text-emerald-400' : 'text-white/40'}`} />
            <span className="text-xs font-bold text-white/60">{peersCount} Active</span>
            <div className={`w-2 h-2 rounded-full ml-2 ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={toggleFaangMode}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border ${
              isFaangMode 
                ? 'bg-purple-500/20 text-purple-300 border-purple-500/30' 
                : 'bg-white/5 text-white/50 border-white/5 hover:bg-white/10 hover:text-white/80'
            }`}
          >
            {isFaangMode ? <FileText className="w-4 h-4" /> : <FileCode2 className="w-4 h-4" />}
            {isFaangMode ? 'FAANG Docs Mode' : 'IDE Mode'}
          </button>

          <select 
            value={editorLanguage} onChange={handleLanguageChange} disabled={isFaangMode}
            className={`bg-white/5 border border-white/10 text-white/80 text-sm rounded-xl px-4 py-2 outline-none focus:ring-1 focus:ring-blue-500/50 cursor-pointer ${isFaangMode ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
            <option value="cpp">C++</option>
          </select>
          
          <button 
            onClick={runCode} disabled={isRunning || isFaangMode}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold transition-all ${
              isFaangMode || isRunning 
                ? 'bg-white/5 text-white/30 cursor-not-allowed' 
                : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)]'
            }`}
          >
            {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} 
            Run
          </button>
        </div>
      </div>

      {/* ─── Editor Canvas ─── */}
      <div className={`flex-1 w-full relative min-h-0 transition-colors duration-500 ${isFaangMode ? 'bg-[#fcfcfc]' : 'bg-[#0a0a0c]'} ${isDragging ? 'pointer-events-none' : ''}`}>
        <div className="absolute inset-0">
          <Editor
            height="100%"
            width="100%"
            language={isFaangMode ? 'plaintext' : editorLanguage}
            theme={isFaangMode ? 'light' : 'vs-dark'}
            value={editorCode}
            onChange={(value) => setEditorCode(value || '')}
            onMount={handleEditorDidMount}
            loading={
              <div className="flex flex-col items-center justify-center h-full text-white/30 gap-3">
                 <Loader2 className="w-6 h-6 animate-spin" />
                 <span className="text-sm font-medium">Booting Collaboration Engine...</span>
              </div>
            }
            options={{
              minimap: { enabled: false },
              fontSize: 15,
              padding: { top: 32, bottom: 32 },
              fontFamily: isFaangMode ? 'Inter, sans-serif' : 'JetBrains Mono, monospace',
              lineNumbers: isFaangMode ? 'off' : 'on',
              folding: !isFaangMode,
              wordWrap: 'on',
              renderLineHighlight: isFaangMode ? 'none' : 'all',
              scrollBeyondLastLine: false,
            }}
          />
        </div>
      </div>

      {/* ─── Resizer ─── */}
      {!isFaangMode && (
        <div 
          onMouseDown={() => setIsDragging(true)}
          className="h-2 w-full bg-white/[0.02] hover:bg-blue-500/50 cursor-row-resize flex items-center justify-center border-y border-white/5 transition-colors z-20"
        >
          <GripHorizontal className={`w-4 h-4 transition-colors ${isDragging ? 'text-blue-400' : 'text-white/20'}`} />
        </div>
      )}

      {/* ─── Terminal ─── */}
      {!isFaangMode && (
        <div style={{ height: terminalHeight }} className="shrink-0 bg-[#050505] flex flex-col transition-none overflow-hidden">
          <div className="h-10 shrink-0 bg-white/[0.02] border-b border-white/5 flex items-center px-6">
            <div className="flex items-center gap-2 text-white/50">
              <TerminalSquare className="w-4 h-4" />
              <span className="text-xs font-bold tracking-wider uppercase">Shared Terminal</span>
            </div>
          </div>
          <div className="flex-1 p-5 overflow-y-auto font-mono text-[13px] leading-relaxed">
            <pre className={`whitespace-pre-wrap ${isError ? 'text-red-400' : 'text-emerald-400/90'}`}>
              {output}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
}