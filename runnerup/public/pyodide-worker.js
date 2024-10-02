importScripts('https://cdn.jsdelivr.net/pyodide/v0.18.1/full/pyodide.js');

let stdinbuffer = null;
let rerun = false
let readlines = []

let pyodide = null;
let inputCallback = null;
let pendingResolve = null;

const replaceStdioCode = `
import sys
import fakeprint

sys.stdout = fakeprint.stdout
sys.stderr = fakeprint.stdout
sys.stdin = fakeprint.stdin
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
      stdout: s,
    });
  },
  flush: () => {},
};

/*
const stdin = {
  readline: () => {
    return new Promise((resolve) => {
        console.log("WORKER: ran stdin ---------------------- awaiting!")
        pendingResolve = resolve;
        postMessage({
            type: 'stdin',
        });
    });
  },
};
*/
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
        console.log("7. WORKER: RECIEVED"/*, stdinbuffer*/)
        stdinbuffer[0] = 0
        const newStdinData = new Int32Array(numberOfElements)

        for (let i = 0; i < numberOfElements; i++) {
            newStdinData[i] = stdinbuffer[1 + i]
        }

        const responseStdin = new TextDecoder('utf-8').decode(newStdinData)
        console.log(responseStdin)
        text += responseStdin

        console.log("8. WORKER: CLEANING UP, CLEARING BUFFER")
        // reset to 0 for now
        for (let i = 0; i < numberOfElements; i++) {
            stdinbuffer[1 + i] = 0
        }
        //console.log(stdinbuffer)

        return text
    },
}

const run = async (code) => {
  try {
    await pyodide.runPythonAsync(code);
  } catch (err) {
    postMessage({
      type: 'stderr',
      stderr: err.toString(),
    });
  }
  postMessage({
    type: 'finished',
  });
};

const initialise = async () => {

  pyodide = await loadPyodide({
    fullStdLib: true,
    indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.18.1/full/',
  });
  postMessage({
    type: 'ready',
  });

  pyodide.registerJsModule('fakeprint', {
    stdout: stdout,
    stderr: stderr,
    stdin: stdin,
  });
  pyodide.runPython(replaceStdioCode);
};

//initialise();

onmessage = function (e) {
  switch (e.data.type) {
    case 'run':
        console.log("WORKER: Recieved run! Clearing Buffer...")
        // reset to 0 for now
        for (let i = 0; i < stdinbuffer.length; i++) {
          stdinbuffer[1 + i] = 0
        }
        const code = e.data.code;
        run(code);
        break;
    case 'init':
        stdinbuffer = e.data.buffer;
        initialise()
        break
  }
};