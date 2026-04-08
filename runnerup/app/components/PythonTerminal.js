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

  const interruptBufferRef = useRef(null)

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

    return `Started: ${startHour}:${startMin}:${startSec} / Elapsed time: ${hours}:${minutes}:${seconds}.${milis % 1000}`
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

          const resizeObserver = new ResizeObserver(() => {
            fitAddon.fit()
          })
          resizeObserver.observe(terminalRef.current)

          terminalInstanceRef.current = term
          terminalInstanceRef.current._resizeObserver = resizeObserver

          // Initialize Web Worker
          const pythonWorker = new Worker('/pyodide-worker.js')
          setWorker(pythonWorker)

          const sharedBuffer = new SharedArrayBuffer(8192)
          sharedBufferRef.current = new Int32Array(sharedBuffer)

          interruptBufferRef.current = new Uint8Array(new SharedArrayBuffer(1))
          interruptBufferRef.current[0] = 0

          pythonWorker.postMessage({ type: "init", buffer: sharedBufferRef.current, interruptBuffer: interruptBufferRef.current })

          // Set up message handler for the worker
          pythonWorker.onmessage = handleWorkerMessage

          props.setEnabled(true)

          console.log("MAIN: Created Terminal, Set up messaging")

        } catch (error) {
          console.error('Error initializing terminal:', error)
        }
      }

      initTerminal()

      // Clean up function
      return () => {
        if (terminalInstanceRef.current) {
          if (terminalInstanceRef.current._resizeObserver) {
            terminalInstanceRef.current._resizeObserver.disconnect()
          }
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
          terminalInstanceRef.current.write('\r\n-----    ' + stopTimer() + '    -----\r\n\r\n')
          props.setIsRunning(false)
          console.log("MAIN: Finished Executing")
          break
      }
    }
  }

  const interruptExecution = () => {
    // 2 stands for SIGINT.
    if (interruptBufferRef.current) {
      interruptBufferRef.current[0] = 2
    }
    // Wake up Atomics.wait if it's currently blocking on user input
    if (isCapturingInput && sharedBufferRef.current) {
      sharedBufferRef.current[0] = 1
      const textBytes = new Uint8Array(sharedBufferRef.current.buffer, 4)
      textBytes.set([10]) // Provide a dummy newline character '\n' to trigger evaluation
      Atomics.notify(sharedBufferRef.current, 0, 1)
      setIsCapturingInput(false)
      inputBufferRef.current = ""
    }
  }

  useEffect(() => {
    if (!props.isRunning) {
      interruptExecution()
    }
    console.log("MAIN: CODE IS NOW " + (props.isRunning ? "RUNNING" : "FINISHED"))
  }, [props.isRunning, isCapturingInput])

  const promptForInput = () => {
    console.log("2. MAIN: prompting for input!")
    setIsCapturingInput(true)
    //setInputBuffer('')
    inputBufferRef.current = ""
    //terminalInstanceRef.current?.write('\n\r> ')
  }

  const handleSendSTDIN = () => {
    // Append a newline because sys.stdin.readline() expects it to signify line finish
    let encodedInput = new TextEncoder("utf-8").encode(inputBufferRef.current + "\n")
    // Write the length of the input byte-array at index 0 of the int32 view
    sharedBufferRef.current[0] = encodedInput.length

    // Write the input byte text to the shared buffer starting at byte offset 4
    const textBytes = new Uint8Array(sharedBufferRef.current.buffer, 4)
    textBytes.set(encodedInput)

    console.log("4. MAIN: Handling STDIN")
    console.log("5. MAIN: NOTIFYING THE THREAD...")

    Atomics.notify(sharedBufferRef.current, 0, 1)
    setIsCapturingInput(false)
    inputBufferRef.current = ""
  }

  const handleUserInput = (key) => {
    let char = key.charCodeAt(0)

    if (isCapturingInput == true) {
      if (key === '\r') {
        // handle Enter key
        console.log("3. MAIN: SENDING INPUT", inputBufferRef.current)
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
    if (interruptBufferRef.current) {
      interruptBufferRef.current[0] = 0 // Clear the interrupt flag before running
    }
    props.setIsRunning(true)
    worker?.postMessage({
      type: 'run',
      code: code
    })
  }

  useEffect(() => {
    if (props.runCode.code != "") {
      runPythonCode(props.runCode.code)
    }
  }, [props.runCode])

  return (
    <div className="w-full h-full overflow-hidden relative" ref={terminalRef} />
  )
}

export default PythonTerminal