'use client';

import { useState } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Code2 } from 'lucide-react';

export default function CodeEditor() {
  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState('// Write your optimized solution here...\n\nfunction solve() {\n  \n}\n');

  return (
    <div className="w-full h-full flex flex-col bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
      
      {/* Editor Header Bar */}
      <div className="h-14 bg-white/[0.02] border-b border-white/5 flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Code2 className="w-5 h-5 text-blue-400" />
          <span className="text-sm font-semibold text-white/70 tracking-wide">Workspace</span>
        </div>
        
        <div className="flex items-center gap-4">
          <select 
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="bg-white/5 border border-white/10 text-white/80 text-sm rounded-lg px-3 py-1.5 outline-none focus:ring-1 focus:ring-blue-500/50 cursor-pointer"
          >
            <option value="javascript">JavaScript</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
          </select>
          
          <button className="flex items-center gap-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all">
            <Play className="w-4 h-4" /> Run Code
          </button>
        </div>
      </div>

      {/* The Actual Monaco Engine */}
      <div className="flex-1 p-4">
        <Editor
          height="100%"
          language={language}
          theme="vs-dark"
          value={code}
          onChange={(value) => setCode(value || '')}
          options={{
            minimap: { enabled: false },
            fontSize: 15,
            padding: { top: 16 },
            fontFamily: 'JetBrains Mono, monospace',
            roundedSelection: true,
            scrollBeyondLastLine: false,
          }}
        />
      </div>
    </div>
  );
}