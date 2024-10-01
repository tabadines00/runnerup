"use client"
import React, { useEffect, useRef, useState } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';

//import dynamic from 'next/dynamic';
//const XTerm = dynamic(() => import('xterm').then(mod => mod.Terminal), { ssr: false });
//const FitAddon = dynamic(() => import('xterm-addon-fit'), { ssr: false });




const PythonTerminal = (props) => {
  const terminalRef = useRef(null);
  const terminalInstanceRef = useRef(null);

  const [terminal, setTerminal] = useState(null);
  const [worker, setWorker] = useState(null);
  const [isCapturingInput, setIsCapturingInput] = useState(false);
  const [stdinbuffer, setStdinbuffer] = useState(null);
  //const [inputBuffer, setInputBuffer] = useState('');
  const inputBufferRef = useRef('');
  const sharedBufferRef = useRef(null);
  const cursorPositionRef = useRef(0)

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
          //terminalInstanceRef.current.onData((data) => handleUserInput(data));
            //setTerminal(terminalInstanceRef.current);
          //} else {
           // console.error('Terminal container ref is null');
          //}

          // Initialize Web Worker
          const pythonWorker = new Worker('/pyodide-worker.js');
          setWorker(pythonWorker);
          

          const sharedBuffer = new SharedArrayBuffer(128);
          
          
          //sharedBufferRef.current = new Int32Array(sharedBuffer);
          sharedBufferRef.current = new Int32Array(sharedBuffer)
          //setStdinbuffer(sharedBuffer);
          pythonWorker.postMessage({ type: "init", buffer: sharedBufferRef.current })
          // Set up message handler for the worker
          pythonWorker.onmessage = handleWorkerMessage;

          
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
          terminalInstanceRef.current.write(event.data.stdout.replace('\n', '\r\n'));
          break;
        case 'stderr':
          terminalInstanceRef.current.write(event.data.stderr.replace('\n', '\r\n'));
          break;
        case 'stdin':
          promptForInput();
          break;
        case 'finished':
          terminalInstanceRef.current.write('\r\n');
          console.log("MAIN: Finished Executing")
          break;
      }
    }
  };

  const promptForInput = () => {
    console.log("2. MAIN: prompting for input!")
    setIsCapturingInput(true)
    //setInputBuffer('');
    inputBufferRef.current = ""
    //terminalInstanceRef.current?.write('\n\r> ');
  };

  const handleSendSTDIN = () => {
      //let inputBuffer = sharedBufferRef.current.current
      let encodedInput = new TextEncoder("utf-8").encode(inputBufferRef.current);

      // let startingIndex = 1
      // encodedInput.forEach((value, index) => {
      //   sharedBufferRef.current[startingIndex + index] = value
      // })
    
      // Write the length of the input text at index 0
      sharedBufferRef.current[0] = encodedInput.length;
  
      // Write the input text to the shared buffer starting at index 1
      for (let i = 0; i < encodedInput.length; i++) {
        sharedBufferRef.current[1 + i] = encodedInput[i];
      }
      console.log("4. MAIN: Handling STDIN")
      
      console.log(sharedBufferRef.current)
      setStdinbuffer(sharedBufferRef.current)
      setIsCapturingInput(false);
  }

  useEffect(()=>{
    //console.log("stdinbufferChanged!")
    if(inputBufferRef.current !== "" && !isCapturingInput && stdinbuffer){
      // Notify the worker that input is ready
      console.log("5. MAIN: NOTIFYING THE THREAD...")
      console.log(stdinbuffer)
      //let temp = new Int32Array(stdinbuffer)
      //console.log(temp)
      //Atomics.store(sharedBufferRef.current, 0, 1);
      Atomics.notify(stdinbuffer, 0, 1);
      inputBufferRef.current = ""
    }
  },[stdinbuffer])

  const handleUserInput = (key) => {
    //console.log(key)
    let char = key.charCodeAt(0)
    if(isCapturingInput == true) {
      console.log("MAIN: capturing", key)
      console.log(isCapturingInput)
    } else {
      console.log("MAIN: new key", key)
      console.log(isCapturingInput)
    }
    if (isCapturingInput == true) {
      if (key === '\r') {  // Enter key
        console.log("3. MAIN: SENDING INPUT", inputBufferRef.current)
        handleSendSTDIN()
        terminalInstanceRef.current?.write('\r\n');
        cursorPositionRef.current = 0
      } else if (char === 127) {  // Backspace
        if (inputBufferRef.current.length > 0 && cursorPositionRef.current > 0) {
            inputBufferRef.current = inputBufferRef.current.slice(0, cursorPositionRef.current - 1) +
                inputBufferRef.current.slice(cursorPositionRef.current);
            terminalInstanceRef.current?.write('\b \b');  // Erase character from terminal
            cursorPositionRef.current -= 1;
        }
      } else {
        //setInputBuffer(prev => prev + key);
        inputBufferRef.current += key
        terminalInstanceRef.current?.write(key);
        cursorPositionRef.current += 1
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
  }, [terminalInstanceRef.current, isCapturingInput]);

  return (
      <div ref={terminalRef} />
  );
};

export default PythonTerminal;