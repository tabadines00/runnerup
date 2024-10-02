"use client"
import React, { useEffect, useRef, useState } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'


const PythonTerminal = (props) => {
  const terminalRef = useRef(null)
  const terminalInstanceRef = useRef(null)

  const [worker, setWorker] = useState(null)
  const [isCapturingInput, setIsCapturingInput] = useState(false)

  const inputBufferRef = useRef('')
  const sharedBufferRef = useRef(null)
  const cursorPositionRef = useRef(0)

  const startTimeRef = useRef(null)
  const endTimeRef = useRef(null)

  let init = false

  function startTimer() {
    startTimeRef.current = new Date()
  }

  function stopTimer() {
    endTimeRef.current = new Date()

    // Calculate elapsed time in milliseconds
    let elapsedTime = endTimeRef.current.getTime() - startTimeRef.current.getTime() 

    let startHour = startTimeRef.current.getHours() % 12
    let startMin = startTimeRef.current.getMinutes().toString().padStart(2, '0')
    let startSec = startTimeRef.current.getSeconds().toString().padStart(2, '0')

    let milis = Math.floor(elapsedTime) 
    let seconds = Math.floor(milis / 1000) 
    let minutes = Math.floor(seconds / 60).toString().padStart(2, '0')
    let hours = Math.floor(seconds / 3600).toString().padStart(2, '0')
    seconds = (seconds % 60).toString().padStart(2, '0')

    return `Started: ${startHour}:${startMin}:${startSec} / Elapsed time: ${hours}:${minutes}:${seconds}.${milis%1000}`
  }

  useEffect(() => {
    if (!init && typeof window !== 'undefined') {
      init = true
      const initTerminal = async () => {
        try {
          // Dynamically import CSS
          await import('@xterm/xterm/css/xterm.css')
          const fitAddon = new FitAddon()
          
          let term = new Terminal({
            cursorBlink: true,
            fontSize: 14,
            theme: { background: '#1a1c1f' },
          })
          console.log("Created a terminal!")
          term.loadAddon(fitAddon)
          
          term.open(terminalRef.current)
          fitAddon.fit()

          terminalInstanceRef.current = term

          // Initialize Web Worker
          const pythonWorker = new Worker('/pyodide-worker.js')
          setWorker(pythonWorker)
          

          const sharedBuffer = new SharedArrayBuffer(128)
          
          
          sharedBufferRef.current = new Int32Array(sharedBuffer)
          pythonWorker.postMessage({ type: "init", buffer: sharedBufferRef.current })

          // Set up message handler for the worker
          pythonWorker.onmessage = handleWorkerMessage
          
        } catch (error) {
          console.error('Error initializing terminal:', error)
        }
      }

      initTerminal()
      
      // Clean up function
      return () => {
        if (terminalInstanceRef.current) {
          terminalInstanceRef.current.dispose()
        }
        if (worker) {
          worker.terminate()
        }
      }
    }
  }, [])

  const handleWorkerMessage = (event) => {
    if (terminalInstanceRef.current) {
      switch (event.data.type) {
        case 'stdout':
          terminalInstanceRef.current.write(event.data.stdout.replace('\n', '\r\n'))
          break
        case 'stderr':
          terminalInstanceRef.current.write(event.data.stderr.replace('\n', '\r\n'))
          break
        case 'stdin':
          promptForInput()
          break
        case 'finished':
          terminalInstanceRef.current.write('\r\n')
          terminalInstanceRef.current.write('----  '+stopTimer()+'    ----\r\n\r\n')
          console.log("MAIN: Finished Executing")
          break
      }
    }
  }

  const promptForInput = () => {
    console.log("2. MAIN: prompting for input!")
    setIsCapturingInput(true)
    //setInputBuffer('')
    inputBufferRef.current = ""
    //terminalInstanceRef.current?.write('\n\r> ')
  }

  const handleSendSTDIN = () => {
      let encodedInput = new TextEncoder("utf-8").encode(inputBufferRef.current)
      // Write the length of the input text at index 0
      sharedBufferRef.current[0] = encodedInput.length
  
      // Write the input text to the shared buffer starting at index 1
      for (let i = 0; i < encodedInput.length; i++) {
        sharedBufferRef.current[1 + i] = encodedInput[i]
      }
      console.log("4. MAIN: Handling STDIN")
      
      //console.log(sharedBufferRef.current)
      //setStdinbuffer(sharedBufferRef.current)
      setIsCapturingInput(false)
  }

  useEffect(()=>{
    if(inputBufferRef.current !== "" && sharedBufferRef.current){
      // Notify the worker that input is ready
      console.log("5. MAIN: NOTIFYING THE THREAD...")
      //console.log(sharedBufferRef.current)
      Atomics.notify(sharedBufferRef.current, 0, 1)  
      inputBufferRef.current = ""
    }
  },[isCapturingInput])

  const handleUserInput = (key) => {
    let char = key.charCodeAt(0)

    if (isCapturingInput == true) {
      if (key === '\r') {
        // handle Enter key
        console.log("3. MAIN: SENDING INPUT" , inputBufferRef.current)
        handleSendSTDIN()
        terminalInstanceRef.current?.write('\r\n')
        cursorPositionRef.current = 0
        
      } else if (char === 127) {
        // handle Backspace
        if (inputBufferRef.current.length > 0 && cursorPositionRef.current > 0) {
            inputBufferRef.current = inputBufferRef.current.slice(0, cursorPositionRef.current - 1) //+ inputBufferRef.current.slice(cursorPositionRef.current)
            terminalInstanceRef.current?.write('\b \b')  // Erase character from terminal
            cursorPositionRef.current -= 1
        }
      } else {
        inputBufferRef.current += key
        terminalInstanceRef.current?.write(key)
        cursorPositionRef.current += 1
      }
      console.log("MAIN: buffer is now", inputBufferRef.current)
    } else {
      console.log("MAIN: no change to buffer")
    }
    
  }

  useEffect(() => {
    if (terminalInstanceRef.current) {
      const disposable = terminalInstanceRef.current.onData((data) => handleUserInput(data))

      return () => {
        disposable.dispose()
      }
    }
  }, [terminalInstanceRef.current, isCapturingInput])

  const runPythonCode = (code) => {
    startTimer()
    worker?.postMessage({
      type: 'run',
      code: code
    })
  }

  useEffect(() => {
    if(props.runCode.code != "") {
      runPythonCode(props.runCode.code)
    }
  }, [props.runCode])

  return (
      <div ref={terminalRef} />
  )
}

export default PythonTerminal