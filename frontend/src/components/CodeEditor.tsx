'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Editor from '@monaco-editor/react';
import { Play, Code2, Loader2, TerminalSquare, GripHorizontal } from 'lucide-react';
import { useUserStore } from '../store/useUserStore';

const BOILERPLATES: Record<string, string> = {
  javascript: '// Write your optimized algorithm or logic here...\n\nfunction solve() {\n  console.log("Hello from JavaScript!");\n}\n\nsolve();\n',
  python: '# Write your optimized Python/ML logic here...\n\ndef solve():\n    print("Hello from Python!")\n\nsolve()\n',
  java: '// Write your Java solution here...\n\nclass Main {\n    public static void main(String[] args) {\n        System.out.println("Hello from Java!");\n    }\n}\n',
  cpp: '#include <iostream>\n\nint main() {\n    std::cout << "Hello from C++!" << std::endl;\n    return 0;\n}\n',
  typescript: 'import React, { useState } from "react";\n\n// Write your React/Next.js component logic here\nexport default function App() {\n  return (\n    <div className="p-4">\n      <h1>Hello World</h1>\n    </div>\n  );\n}\n',
  sql: '-- Write your optimized SQL query here\n\n-- Mock execution will return success for valid syntax\nSELECT "Hello from SQL!" as Output;\n',
  markdown: '# System Design: [Insert System Name]\n\n## 1. Functional Requirements\n- \n\n## 2. High-Level Architecture\n- \n\n## 3. Database Schema\n- \n\n## 4. API Endpoints\n- \n'
};

export default function CodeEditor() {
  const { editorCode, editorLanguage, setEditorCode, setEditorLanguage, interviewConfig } = useUserStore();
  const [isMounted, setIsMounted] = useState(false);
  
  const [isRunning, setIsRunning] = useState(false);
  const [output, setOutput] = useState<string>('// Code execution output will appear here...');
  const [isError, setIsError] = useState(false);

  // 🚀 NEW: Resizer State
  const [terminalHeight, setTerminalHeight] = useState(150);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsMounted(true);
    
    if (interviewConfig?.category) {
      let defaultLang = 'javascript';
      const cat = interviewConfig.category;

      if (cat.includes('Frontend') || cat.includes('Full Stack') || cat.includes('React') || cat.includes('MERN')) {
        defaultLang = 'typescript';
      } else if (cat.includes('AI') || cat.includes('Machine Learning') || cat.includes('Data Science')) {
        defaultLang = 'python';
      } else if (cat.includes('System Design')) {
        defaultLang = 'markdown';
      } else if (cat.includes('Database') || cat.includes('SQL')) {
        defaultLang = 'sql';
      } else if (cat.includes('Java ') || cat === 'Java') {
        defaultLang = 'java';
      } else if (cat.includes('C++') || cat === 'C++') {
        defaultLang = 'cpp';
      } else {
        defaultLang = 'javascript';
      }

      setEditorLanguage(defaultLang);
      setEditorCode(BOILERPLATES[defaultLang] || BOILERPLATES['javascript']);
      setOutput('// Code execution output will appear here...');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [interviewConfig?.category]); 

  const handleLanguageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newLang = e.target.value;
    setEditorLanguage(newLang);
    setEditorCode(BOILERPLATES[newLang] || '');
    setOutput('// Code execution output will appear here...');
  };

  const handleEditorWillMount = (monaco: any) => {
    monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
      target: monaco.languages.typescript.ScriptTarget.ES2020,
      allowNonTsExtensions: true,
      moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
      module: monaco.languages.typescript.ModuleKind.CommonJS,
      noEmit: true,
      esModuleInterop: true,
      jsx: monaco.languages.typescript.JsxEmit.React, 
      reactNamespace: "React",
      allowJs: true,
    });

    monaco.languages.typescript.typescriptDefaults.addExtraLib(
      `
      declare module 'react' {
        const React: any;
        export default React;
        export const useState: any;
        export const useEffect: any;
        export const useRef: any;
        export const useCallback: any;
        export const useMemo: any;
      }
      `,
      'file:///node_modules/@types/react/index.d.ts'
    );
  };

  const runCode = async () => {
    if (!editorCode.trim()) {
      setOutput('Error: Editor is empty.');
      setIsError(true);
      return;
    }

    setIsRunning(true);
    setOutput('Compiling and running on secure cloud server...');
    setIsError(false);

    // Automatically pop the terminal open a bit if the user had it fully collapsed
    if (terminalHeight < 100) setTerminalHeight(200);

    try {
      const response = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: editorCode,
          language: editorLanguage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setOutput(data.error || 'Execution failed due to a server error.');
        setIsError(true);
        return;
      }

      if (data.run && data.run.code !== 0) {
        setOutput(data.run.output);
        setIsError(true);
      } else if (data.run) {
        setOutput(data.run.output || 'Code executed successfully with no console output.');
        setIsError(false);
      } else {
        setOutput('Unknown execution format received.');
        setIsError(true);
      }

    } catch (error) {
      console.error(error);
      setOutput('Error: Failed to connect to the execution engine.');
      setIsError(true);
    } finally {
      setIsRunning(false);
    }
  };

  // 🚀 NEW: Resizer Drag Logic
  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    
    // Calculate new height from the bottom of our container
    const containerRect = containerRef.current.getBoundingClientRect();
    const newHeight = containerRect.bottom - e.clientY;

    // Constraint: Terminal must be at least 40px (just the header) and max 80% of the container
    const clampedHeight = Math.max(40, Math.min(newHeight, containerRect.height * 0.8));
    setTerminalHeight(clampedHeight);
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      // Disable text selection on the whole page while dragging
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
    <div ref={containerRef} className="w-full h-full min-h-[400px] flex flex-col bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
      
      {/* Editor Header Bar */}
      <div className="h-14 shrink-0 bg-white/[0.02] border-b border-white/5 flex items-center justify-between px-6 z-10">
        <div className="flex items-center gap-3">
          <Code2 className="w-5 h-5 text-blue-400" />
          <span className="text-sm font-semibold text-white/70 tracking-wide">Workspace</span>
        </div>
        
        <div className="flex items-center gap-4">
          <select 
            value={editorLanguage}
            onChange={handleLanguageChange}
            className="bg-white/5 border border-white/10 text-white/80 text-sm rounded-lg px-3 py-1.5 outline-none focus:ring-1 focus:ring-blue-500/50 cursor-pointer"
          >
            <option value="javascript">JavaScript (Node.js/DSA)</option>
            <option value="typescript">TypeScript (React/Next)</option>
            <option value="python">Python (AI/ML/Data)</option>
            <option value="java">Java (Enterprise/DSA)</option>
            <option value="cpp">C++ (DSA/Systems)</option>
            <option value="sql">SQL (Database)</option>
            <option value="markdown">Markdown (System Design)</option>
          </select>
          
          {!(editorLanguage === 'markdown' || editorLanguage === 'typescript') && (
            <button 
              onClick={runCode}
              disabled={isRunning}
              className="flex items-center gap-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 border border-emerald-500/30 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all"
            >
              {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} 
              {isRunning ? 'Running...' : 'Run Code'}
            </button>
          )}
        </div>
      </div>

      {/* Code Editor Area */}
      {/* 🚀 FIXED: pointer-events-none applied while dragging so Monaco doesn't steal the mouse */}
      <div className={`flex-1 w-full relative bg-[#0a0a0a] min-h-0 ${isDragging ? 'pointer-events-none' : ''}`}>
        <div className="absolute inset-0">
          <Editor
            height="100%"
            width="100%"
            language={editorLanguage}
            theme="vs-dark"
            value={editorCode}
            onChange={(value) => setEditorCode(value || '')}
            beforeMount={handleEditorWillMount}
            loading={
              <div className="flex flex-col items-center justify-center h-full text-white/30 gap-3">
                 <Loader2 className="w-6 h-6 animate-spin" />
                 <span className="text-sm font-medium">Initializing Engine...</span>
              </div>
            }
            options={{
              minimap: { enabled: false },
              fontSize: 15,
              padding: { top: 16, bottom: 16 },
              fontFamily: 'JetBrains Mono, monospace',
              roundedSelection: true,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              wordWrap: editorLanguage === 'markdown' ? 'on' : 'off', 
            }}
          />
        </div>
      </div>

      {/* 🚀 NEW: Draggable Resizer Handle */}
      <div 
        onMouseDown={() => setIsDragging(true)}
        className="h-3 w-full bg-white/[0.02] hover:bg-blue-500/30 cursor-row-resize flex items-center justify-center border-y border-white/5 transition-colors z-20"
      >
        <GripHorizontal className={`w-5 h-5 transition-colors ${isDragging ? 'text-blue-400' : 'text-white/20'}`} />
      </div>

      {/* Terminal Output Area */}
      <div 
        style={{ height: terminalHeight }} 
        className="shrink-0 bg-[#050505] flex flex-col transition-none overflow-hidden"
      >
        <div className="h-10 shrink-0 bg-white/[0.02] border-b border-white/5 flex items-center px-6">
          <div className="flex items-center gap-2 text-white/50">
            <TerminalSquare className="w-4 h-4" />
            <span className="text-xs font-semibold tracking-wider uppercase">Terminal Output</span>
          </div>
        </div>
        <div className="flex-1 p-4 overflow-y-auto font-mono text-[13px] leading-relaxed">
          <pre className={`whitespace-pre-wrap ${isError ? 'text-red-400' : 'text-emerald-400/90'}`}>
            {output}
          </pre>
        </div>
      </div>

    </div>
  );
}