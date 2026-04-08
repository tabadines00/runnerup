importScripts('https://cdn.jsdelivr.net/pyodide/v0.26.2/full/pyodide.js')

let stdinbuffer = null
let interruptBuffer = null
let rerun = false
let readlines = []

let pyodide = null;
let inputCallback = null;
let pendingResolve = null;

const replaceStdioCode = `
import sys
import fakeprint

sys.stdout = fakeprint.stdout
sys.stderr = fakeprint.stderr
sys.stdin = fakeprint.stdin

def custom_excepthook(exc_type, exc_value, exc_traceback):
    if issubclass(exc_type, KeyboardInterrupt):
        pass
    else:
        sys.__excepthook__(exc_type, exc_value, exc_traceback)

sys.excepthook = custom_excepthook
`;

const stdout = {
  write: (s) => {
    console.log("WORKER: ran stdout", s)
    postMessage({
      type: 'stdout',
      stdout: s,
    });
  },
  flush: () => {},
};

const stderr = {
  write: (s) => {
    console.log("WORKER: ran stderr")
    postMessage({
      type: 'stderr',
      stderr: s,
    });
  },
  flush: () => {},
};

const stdin = {
    readline: () => {
        // Send message to activate stdin mode
        postMessage({
            type: 'stdin',
        })
        let text = ''
        console.log("1. WORKER: LOCKING THE THREAD FOR INPUT...")
        Atomics.wait(stdinbuffer, 0, 0)
        console.log("6. WORKER: UNLOCKING...")
        const numberOfElements = stdinbuffer[0]
        console.log("7. WORKER: RECIEVED", numberOfElements, "bytes")
        
        // Read text starting from byte offset 4 of the underlying SharedArrayBuffer
        const textBytes = new Uint8Array(stdinbuffer.buffer, 4, numberOfElements)
        
        // TextDecoder cannot decode directly from a SharedArrayBuffer for security/racing reasons
        // So we copy the bytes into a normal (local) Uint8Array first
        const localBytes = new Uint8Array(textBytes)
        
        const responseStdin = new TextDecoder('utf-8').decode(localBytes)
        console.log(responseStdin)
        text += responseStdin

        console.log("8. WORKER: CLEANING UP, CLEARING BUFFER")
        // reset lock
        stdinbuffer[0] = 0
        // clear the text bytes to prevent leaking over reads
        textBytes.fill(0)

        return text
    },
}

const run = async (code) => {
  try {
    await pyodide.runPythonAsync(code);
  } catch (err) {
    if ((interruptBuffer && interruptBuffer[0] === 2) || err.toString().includes("KeyboardInterrupt")) {
        // Ignore the JS-side exception since we gracefully stopped it
    } else {
        postMessage({
        type: 'stderr',
        stderr: err.toString(),
        });
    }
  }
  postMessage({
    type: 'finished',
  })
};

const initialise = async () => {

  pyodide = await loadPyodide({
    fullStdLib: true,
    indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.2/full/'
  });
  pyodide.setInterruptBuffer(interruptBuffer)

  postMessage({
    type: 'ready',
  })

  pyodide.registerJsModule('fakeprint', {
    stdout: stdout,
    stderr: stderr,
    stdin: stdin,
  })

  pyodide.runPython(replaceStdioCode);
  
};

//initialise();

onmessage = function (e) {
  switch (e.data.type) {
    case 'run':
        console.log("WORKER: Recieved run! Clearing Buffer...")
        // reset to 0 for now
        stdinbuffer[0] = 0;
        const code = e.data.code;
        run(code);
        break;
    case 'init':
        stdinbuffer = e.data.buffer
        interruptBuffer = e.data.interruptBuffer
        initialise()
        break
  }
};