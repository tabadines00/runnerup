"use client"
import React, { forwardRef, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Editor } from "@monaco-editor/react"
import XTerm from './xterm-component';

// Dynamically import components that rely on browser APIs
//const MonacoEditor = dynamic(() => import('@monaco-editor/react'), { ssr: false });
//const XTerm = dynamic(() => import('./xterm-component'), { ssr: false });

const ScriptRunner = () => {
  const [code, setCode] = useState('# Your Python script here\nprint("Hello, World!")');
  const [output, setOutput] = useState('');
  const workerRef = useRef(null);
  const terminalRef = useRef(null);
  const inputResolverRef = useRef(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Initialize the worker
      workerRef.current = new Worker(new URL('./nextjs-pyodide-worker.js', import.meta.url));
      workerRef.current.onmessage = handleWorkerMessage;
    }
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  const handleWorkerMessage = (event) => {
    const { type, data } = event.data;
    switch (type) {
      case 'stdout':
      case 'stderr':
        setOutput(prev => prev + data);
        terminalRef.current?.write(data);
        break;
      case 'stdin':
        // Prompt for input
        terminalRef.current?.write(data);
        inputResolverRef.current = (input) => {
          workerRef.current.postMessage({ type: 'stdin', data: input });
        };
        break;
      case 'result':
        setOutput(prev => prev + '\nScript execution completed.');
        terminalRef.current?.write('\r\nScript execution completed.\r\n');
        break;
    }
  };

  const runScript = () => {
    setOutput('');
    terminalRef.current?.clear();
    workerRef.current.postMessage({ type: 'run', code });
  };

  const handleTerminalInput = (data) => {
    if (inputResolverRef.current) {
      inputResolverRef.current(data);
      inputResolverRef.current = null;
      terminalRef.current?.write('\r\n');
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div style={{ width: '50%' }}>
        <Editor
          language="python"
          theme="vs-dark"
          value={code}
          onChange={setCode}
          options={{ minimap: { enabled: false } }}
        />
      </div>
      <div style={{ width: '50%' }}>
        <XTerm ref={terminalRef} onData={handleTerminalInput} />
      </div>
      <button 
        style={{ position: 'absolute', top: '10px', right: '10px' }}
        onClick={runScript}
      >
        Run Script
      </button>
    </div>
  );
}

export default ScriptRunner