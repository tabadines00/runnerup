let rerun = false
let readlines = []

let inputCallback = null;
let pendingResolve = null;

const replaceStdioCode = `
function output(x) {
    console.log("printing out " + x)
    postMessage({
        type: 'stdout',
        stdout: x + \"\\n\\r\"
    })
}
`;

function replaceLogOut(code) {
    return code.replaceAll("console.log(", "output(")
}

const run = async (code) => {
  try {

    let stdoutput = await eval(replaceStdioCode + replaceLogOut(code))
    if(stdoutput) {
        postMessage({
            type: 'stdout',
            stdout: stdoutput
        })
    }
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
  postMessage({
    type: 'ready',
  });
};

//initialise();

onmessage = function (e) {
  switch (e.data.type) {
    case 'run':
        console.log("WORKER: Recieved run!")
        const code = e.data.code;
        run(code);
        break;
    case 'init':
        initialise()
        break
    /*
    case 'input':
        console.log("WORKER: Recieved input!", e.data.input)
        if (pendingResolve) {
            pendingResolve(e.data.input);
            pendingResolve = null;
        }
        break;
        */
  }
};