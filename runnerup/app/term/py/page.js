"use client"
import { useState, useRef } from "react"
import PythonTerminal from "../../components/PythonTerminal"
import { Editor } from "@monaco-editor/react"
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from "react-resizable-panels"
import { PlayIcon, StopIcon } from "@radix-ui/react-icons"

export default function Home() {
	const editorRef = useRef(null)
	const [runCode, setRunCode] = useState({trigger: false, code: ""});

	const [enabled, setEnabled] = useState(false)
  	const [isRunning, setIsRunning] = useState(false)

	function handleEditorDidMount(editor, monaco) {
		editorRef.current = editor
	}

	function getValue() {
		return editorRef.current.getValue()
	}

	function runner() {
		if(!isRunning) {
			setRunCode({
				trigger: !runCode.trigger,
				code: getValue()
			})
		} else {
			setIsRunning(false) // This drives the stop.
		}
	}

	let defaultCode = `# write code here
while (True):
	color = input("what is your favorite color? ")
	print(color)
`

	return (
		<div className="h-screen w-screen flex flex-col bg-neutral-950 overflow-hidden">
			<header className="flex h-14 items-center justify-between px-6 border-b border-neutral-800 bg-neutral-900 shrink-0">
				<div className="flex items-center gap-4">
					<div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-600 text-white font-bold text-xs">Py</div>
					<h1 className="text-sm font-semibold text-neutral-200">main.py</h1>
				</div>
				<button 
					className={`flex items-center gap-2 px-4 py-1.5 rounded-md text-sm font-medium transition ${isRunning ? 'bg-red-500/10 text-red-500 hover:bg-red-500/20' : 'bg-green-600 text-white hover:bg-green-500'}`} 
					onClick={runner}
				>
					{isRunning ? (
						<>
							<StopIcon className="w-4 h-4" /> Stop
						</>
					) : (
						<>
							<PlayIcon className="w-4 h-4" /> Run
						</>
					)}
				</button>
			</header>

			<main className="flex-1 overflow-hidden h-full">
				<PanelGroup direction="horizontal" className="h-full">
					<Panel defaultSize={50} minSize={20} collapsible={true} className="flex flex-col h-full relative">
						<Editor 
							height="100%"
							defaultLanguage="python" 
							theme="vs-dark" 
							options={{
								minimap: { enabled: false },
								padding: { top: 16 }
							}} 
							defaultValue={defaultCode} 
							onMount={handleEditorDidMount}
						/>
					</Panel>

					<PanelResizeHandle className="w-1.5 bg-neutral-900 hover:bg-neutral-800 transition-colors flex items-center justify-center shrink-0 group z-10 cursor-col-resize">
						<div className="h-8 w-0.5 bg-neutral-600 group-hover:bg-neutral-400 rounded-full transition-colors" />
					</PanelResizeHandle>

					<Panel defaultSize={50} minSize={20} collapsible={true} className="flex flex-col h-full bg-[#1a1c1f]">
						<div className="flex flex-col h-full p-4 pl-6 relative">
							<div className="text-xs text-neutral-500 mb-2 uppercase tracking-wider font-semibold shrink-0">Terminal Console</div>
							<div className="flex-1 min-h-0 w-full relative">
								<div className="absolute inset-0">
									<PythonTerminal
										runCode={runCode}
										enabled={enabled}
										setEnabled={setEnabled}
										isRunning={isRunning}
										setIsRunning={setIsRunning}
									/>
								</div>
							</div>
						</div>
					</Panel>
				</PanelGroup>
			</main>
		</div>
	);
}  