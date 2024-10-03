"use client"
import { useState, useRef } from "react"
import PythonTerminal from "../../components/PythonTerminal"
import { Editor } from "@monaco-editor/react"

export default function Home() {
	const editorRef = useRef(null)
	const [runCode, setRunCode] = useState({trigger: false, code: ""});

	const [enabled, setEnabled] = useState(false)
  	const [isRunning, setIsRunning] = useState(false)

	function handleEditorDidMount(editor, monaco) {
		editorRef.current = editor
	}

	function getValue() {
		//alert(editorRef.current.getValue())
		return editorRef.current.getValue()
	}

	function runner() {
		if(isRunning) {
			setRunCode({
				trigger: !runCode.trigger,
				code: getValue()
			})
		} else {
			setIsRunning(false)
		}
	}

	let defaultCode = `# write code here
while (True):
	color = input("what is your favorite color? ")
	print(color)
`

	return (
		<div>
			<main>
				<button className="p-4 bg-green-600 text-white" onClick={runner}>{isRunning ? "Stop" : "Run"}</button>
				<div className="flex flex-row">
					<Editor height="90vh" defaultLanguage="python" theme="vs-dark" options={{
						minimap: {
						enabled: false,
						},
      				}} defaultValue={defaultCode} onMount={handleEditorDidMount}/>
					<PythonTerminal
						runCode={runCode}
						enabled={enabled}
						setEnabled={setEnabled}
						isRunning={isRunning}
						setIsRunning={setIsRunning}
					/>
				</div>
			</main>
		</div>
	);
  }
  