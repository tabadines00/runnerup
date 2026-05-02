"use client"
import React, { useEffect, useRef, useState } from 'react'
import { Terminal } from '@xterm/xterm'
import { FitAddon } from '@xterm/addon-fit'
import '@xterm/xterm/css/xterm.css'

const PygameTerminal = (props) => {
  const terminalRef = useRef(null)
  const terminalInstanceRef = useRef(null)

  const pyodideRef = useRef(null)
  const interruptBufferRef = useRef(null)

  const startTimeRef = useRef(null)
  const endTimeRef = useRef(null)

  let initRef = useRef(false)

  function startTimer() {
    startTimeRef.current = new Date()
  }

  function stopTimer() {
    endTimeRef.current = new Date()
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
    if (!initRef.current && typeof window !== 'undefined') {
      initRef.current = true
      const initTerminal = async () => {
        try {
          await import('@xterm/xterm/css/xterm.css')
          const fitAddon = new FitAddon()

          let term = new Terminal({
            cursorBlink: true,
            fontSize: 14,
            theme: { background: '#1a1c1f' },
          })
          term.loadAddon(fitAddon)
          term.open(terminalRef.current)
          fitAddon.fit()

          const resizeObserver = new ResizeObserver(() => {
            fitAddon.fit()
          })
          resizeObserver.observe(terminalRef.current)

          terminalInstanceRef.current = term
          terminalInstanceRef.current._resizeObserver = resizeObserver
          term.write("Loading Pyodide (Main Thread)...\r\n")

          // Dynamically load Pyodide script
          const script = document.createElement('script')
          script.src = "https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js"
          script.onload = async () => {
            try {
              let pyodide = await window.loadPyodide()
              pyodideRef.current = pyodide

              await pyodide.loadPackage("pygame-ce")
              if (props.canvasRef.current) {
                pyodide.canvas.setCanvas2D(props.canvasRef.current)
                if (pyodide._module) {
                  // Completely blind Emscripten to all keyboard events by pointing it to a detached element
                  const dummyElement = document.createElement('div');
                  pyodide._module.keyboardListeningElement = dummyElement;
                }
              }

              pyodide.setStdout({
                batched: (msg) => terminalInstanceRef.current?.write(msg.replace(/\n/g, '\r\n') + '\r\n')
              })
              pyodide.setStderr({
                batched: (msg) => terminalInstanceRef.current?.write(msg.replace(/\n/g, '\r\n') + '\r\n')
              })

              term.write("Ready.\r\n\r\n")
              props.setEnabled(true)
            } catch (err) {
              term.write("Error loading Pyodide: " + err.toString() + "\r\n")
            }
          }
          document.body.appendChild(script)

        } catch (error) {
          console.error('Error initializing terminal:', error)
        }
      }

      initTerminal()

      const handleUnhandledRejection = (event) => {
        if (event.reason && event.reason.toString().includes("KeyboardInterrupt")) {
          event.preventDefault()
          event.stopImmediatePropagation()
        }
      }
      
      const handleGlobalError = (event) => {
        const msg = event.error ? event.error.toString() : event.message
        if (msg && msg.includes("KeyboardInterrupt")) {
          event.preventDefault()
          event.stopImmediatePropagation()
        }
      }

      window.addEventListener('unhandledrejection', handleUnhandledRejection, true)
      window.addEventListener('error', handleGlobalError, true)

      return () => {
        window.removeEventListener('unhandledrejection', handleUnhandledRejection, true)
        window.removeEventListener('error', handleGlobalError, true)
        if (terminalInstanceRef.current) {
          if (terminalInstanceRef.current._resizeObserver) {
            terminalInstanceRef.current._resizeObserver.disconnect()
          }
          terminalInstanceRef.current.dispose()
        }
      }
    }
  }, [props.canvasRef])

  const interruptExecution = () => {
    if (pyodideRef.current) {
      try {
        // Cancelling all asyncio tasks corrupts Pyodide's internal webloop on the main thread,
        // which inadvertently breaks browser event processing for the Monaco editor!
        // Instead, we natively post a pygame.QUIT event into the SDL event queue.
        pyodideRef.current.runPython(`
import pygame
try:
    if pygame.get_init():
        pygame.event.post(pygame.event.Event(pygame.QUIT))
except Exception:
    pass
        `)
      } catch(e) {
        console.error("Failed to post QUIT event:", e)
      }
    }
  }

  useEffect(() => {
    if (!props.isRunning && initRef.current) {
      interruptExecution()
    }
  }, [props.isRunning])

  const runPythonCode = async (code) => {
    if (!pyodideRef.current) return;
    
    startTimer()
    if (interruptBufferRef.current) {
      interruptBufferRef.current[0] = 0 
    }
    props.setIsRunning(true)
    
    try {
      // 1. Load built-in packages
      await pyodideRef.current.loadPackagesFromImports(code)
      
      // 2. Load PyPI packages using micropip
      await pyodideRef.current.loadPackage("micropip")
      const micropip = pyodideRef.current.pyimport("micropip")
      pyodideRef.current.globals.set("__USER_CODE__", code)
      
      // We extract all imports and try to install them from PyPI
      const importsProxy = pyodideRef.current.runPython(`
import pyodide.code
pyodide.code.find_imports(__USER_CODE__)
      `)
      const imports = importsProxy.toJs()
      importsProxy.destroy()
      
      try {
        if (imports && imports.length > 0) {
          // Map special packages to their direct WASM wheels if PyPI doesn't host them,
          // and filter out packages like 'pygame' which are already provided by 'pygame-ce'
          const installList = imports.map(pkg => {
            if (pkg === 'pymunk') return window.location.origin + '/pymunk-7.2.0-cp312-cp312-pyodide_2024_0_wasm32.whl'
            return pkg
          }).filter(pkg => pkg !== 'pygame')

          if (installList.length > 0) {
            console.log("Micropip attempting to install:", installList)
            // Use keep_going=True to ignore standard library modules that aren't on PyPI
            await micropip.install(installList, true)
          }
        }
      } catch(e) {
        console.warn("Micropip install warning:", e)
      }

      await pyodideRef.current.runPythonAsync(code)
    } catch (err) {
      if (!err.toString().includes("CancelledError")) {
        terminalInstanceRef.current?.write(err.toString().replace(/\n/g, '\r\n') + '\r\n')
      }
    } finally {
      // Bulletproof cleanup: No matter how the code exits (success, exception, or stop button),
      // we brutally tear down Pygame to instantly release Emscripten's keyboard hooks.
      try {
        pyodideRef.current.runPython(`
import sys
if 'pygame' in sys.modules:
    import pygame
    if pygame.get_init():
        pygame.quit()
        `)
      } catch (e) {
        console.error("Teardown failed:", e);
      }
      
      terminalInstanceRef.current?.write('\r\n-----    ' + stopTimer() + '    -----\r\n\r\n')
      props.setIsRunning(false)
    }
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

export default PygameTerminal
