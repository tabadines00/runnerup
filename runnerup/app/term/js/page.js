"use client"
import { useState, useRef } from "react"
import JsTerminal from "../../components/JsTerminal"
import { Editor } from "@monaco-editor/react"

export default function Home() {
	const editorRef = useRef(null)
	const [runCode, setRunCode] = useState({trigger: false, code: ""});

	function handleEditorDidMount(editor, monaco) {
		editorRef.current = editor
	}

	function getValue() {

		alert(editorRef.current.getValue())
		return editorRef.current.getValue()
	}

	function runner() {
		setRunCode({
			trigger: !runCode.trigger,
			code: getValue()
		})
	}

	let defaultCode = `// write code here
console.log("hello")
`

	return (
		<div>
			<main>
				<button className="p-4 bg-green-600 text-white" onClick={runner}>Run</button>
				<div className="flex flex-row">
					<Editor height="100vh" defaultLanguage="javascript" theme="vs-dark" defaultValue={defaultCode} onMount={handleEditorDidMount}/>
					<JsTerminal className="h-full" runCode={runCode}/>
				</div>
			</main>
		</div>
	);
  }
  