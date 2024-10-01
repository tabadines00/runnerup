importScripts('https://cdn.jsdelivr.net/pyodide/v0.22.1/full/pyodide.js');

let pyodide;

async function loadPyodide() {
  pyodide = await loadPyodide({
    indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.22.1/full/',
  });
  //await pyodide.loadPackage('micropip');
  //const micropip = pyodide.pyimport('micropip');
  //await micropip.install('numpy');
}

loadPyodide();

self.onmessage = async (event) => {
  const { type, code } = event.data;
  
  if (type === 'run') {
    //await pyodide.loadPackagesFromImports(code);
    
    const stdinBuffer = [];
    let stdinResolve;
    
    function stdin() {
      self.postMessage({ type: 'stdin', data: 'Input: ' });
      return new Promise((resolve) => {
        stdinResolve = resolve;
      });
    }

    function stdout(text) {
      self.postMessage({ type: 'stdout', data: text });
    }

    function stderr(text) {
      self.postMessage({ type: 'stderr', data: text });
    }

    try {
      pyodide.runPython(`
        import sys
        from io import StringIO
        
        class StdoutCatcher(StringIO):
            def write(self, text):
                __STDOUT__(text)
                return len(text)
        
        class StderrCatcher(StringIO):
            def write(self, text):
                __STDERR__(text)
                return len(text)
        
        sys.stdin.readline = __STDIN__
        sys.stdout = StdoutCatcher()
        sys.stderr = StderrCatcher()
      `);

      pyodide.globals.set('__STDIN__', stdin);
      pyodide.globals.set('__STDOUT__', stdout);
      pyodide.globals.set('__STDERR__', stderr);

      await pyodide.runPythonAsync(code);
      self.postMessage({ type: 'result', data: 'Script execution completed.' });
    } catch (error) {
      stderr(`Error: ${error.message}\n`);
    }
  } else if (type === 'stdin') {
    stdinResolve(event.data.data);
  }
};
