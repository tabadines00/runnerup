import { loadPyodide } from "pyodide";

async function main() {
  const pyodide = await loadPyodide();
  await pyodide.loadPackage("micropip");
  const micropip = pyodide.pyimport("micropip");
  console.log("Installing pymunk...");
  try {
    await micropip.install("pymunk");
    console.log("Installation successful!");
    pyodide.runPython("import pymunk; print('Pymunk version:', pymunk.__version__)");
  } catch(e) {
    console.error("Installation failed:", e);
  }
}
main();
