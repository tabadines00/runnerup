"use client"
import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

//import dynamic from 'next/dynamic';
//const XTerm = dynamic(() => import('xterm').then(mod => mod.Terminal), { ssr: false });
//const FitAddon = dynamic(() => import('xterm-addon-fit'), { ssr: false });




const JsTerminal = (props) => {
  const terminalRef = useRef(null);
  const terminalInstanceRef = useRef(null);

  const [terminal, setTerminal] = useState(null);
  const [worker, setWorker] = useState(null);
  const [isCapturingInput, setIsCapturingInput] = useState(false);
  const [stdinbuffer, setStdinbuffer] = useState(null);
  //const [inputBuffer, setInputBuffer] = useState('');
  const inputBufferRef = useRef('');
  let sharedBufferRef = useRef('')

  let init = false

  useEffect(() => {
    if (!init && typeof window !== 'undefined') {
      init = true
      const initTerminal = async () => {
        try {
          // Dynamically import CSS
          await import('@xterm/xterm/css/xterm.css');
          const fitAddon = new FitAddon();
          // const Terminal = await XTerm;
          //const Terminal = xtermModule.Terminal;

          // if (!Terminal) {
          //   console.error('Terminal class not found in xterm module');
          //   return;
          // }
          
          let term = new Terminal({
            cursorBlink: true,
            fontSize: 14,
            theme: { background: '#1a1c1f' },
          });
          console.log("Created a terminal!")
          term.loadAddon(fitAddon)
          
          //if (terminalInstanceRef.current) {
          term.open(terminalRef.current);
          fitAddon.fit()

          terminalInstanceRef.current = term
            //setTerminal(terminalInstanceRef.current);
          //} else {
           // console.error('Terminal container ref is null');
          //}

          // Initialize Web Worker
          const jsWorker = new Worker('/js-worker.js');
          setWorker(jsWorker);
          
          jsWorker.postMessage({ type: "init" })
          // Set up message handler for the worker
          jsWorker.onmessage = handleWorkerMessage;

          
        } catch (error) {
          console.error('Error initializing terminal:', error);
        }
      };

      initTerminal();
      
      // Clean up function
      return () => {
        if (terminalInstanceRef.current) {
          terminalInstanceRef.current.dispose();
        }
        if (worker) {
          worker.terminate();
        }
      };
    }
  }, []);

  const handleWorkerMessage = (event) => {
    if (terminalInstanceRef.current) {
      switch (event.data.type) {
        case 'stdout':
          terminalInstanceRef.current.write(event.data.stdout);
          break;
        case 'stderr':
          terminalInstanceRef.current.write(event.data.stderr);
          break;
        case 'stdin':
          promptForInput();
          break;
        case 'finished':
          terminalInstanceRef.current.write('\r\n');
          break;
      }
    }
  };

  const promptForInput = () => {
    console.log("MAIN: prompting for input!")
    setIsCapturingInput(true);
    //setInputBuffer('');
    inputBufferRef.current = ""
    terminalInstanceRef.current?.write('\r\n> ');
  };

  const handleSendSTDIN = () => {

      console.log()
  
      // Notify the worker that input is ready
      console.log("MAIN: NOTIFYING THE THREAD...")
  }

  const handleUserInput = (key) => {
    //console.log(key)
    if(isCapturingInput) {
      console.log("MAIN: capturing", key)
    } else {
      console.log("MAIN: new key", key)
    }
    if (isCapturingInput) {
      if (key === '\r') {  // Enter key
        setIsCapturingInput(false);
        console.log("MAIN: SENDING INPUT", inputBufferRef.current)
        handleSendSTDIN()
        // worker?.postMessage({
        //   type: 'input',
        //   input: inputBufferRef.current + '\n'
        // });
        //setInputBuffer('');
        inputBufferRef.current = ""
        terminalInstanceRef.current?.write('\r\n');
      } else {
        //setInputBuffer(prev => prev + key);
        inputBufferRef.current += key
        terminalInstanceRef.current?.write(key);
      }
    }
    console.log("MAIN: buffer is now", inputBufferRef.current)
  };

  const runPythonCode = (code) => {
    worker?.postMessage({
      type: 'run',
      code: code
    });
  };

  useEffect(() => {
    if(props.runCode.code != "") {
      runPythonCode(props.runCode.code)
    }
  }, [props.runCode])

  useEffect(() => {
    if (terminalInstanceRef.current) {
      terminalInstanceRef.current.onData((data) => handleUserInput(data));
    }
  }, [terminalInstanceRef.current, isCapturingInput, inputBufferRef.current]);

  return (
      <div ref={terminalRef} />
  );
};

export default JsTerminal;