"use client"
import { useState, useRef } from "react"
import PythonTerminal from "../../../components/PythonTerminal"
import { Editor } from "@monaco-editor/react"
import { useEffect } from "react"
import { useRouter } from "next/navigation"

export default function Home({params: {slug}}) {
    const router = useRouter()
	const editorRef = useRef(null)
	const [runCode, setRunCode] = useState({trigger: false, code: ""});
    const [loadedCode, setLoadedCode] = useState("")

	const [enabled, setEnabled] = useState(false)
  	const [isRunning, setIsRunning] = useState(false)

	function handleEditorDidMount(editor, monaco) {
		editorRef.current = editor
	}

	function getValue() {
		//alert(editorRef.current.getValue())
		return editorRef.current.getValue()
	}

    function setValue(val) {
        if(editorRef.current != null)
            return editorRef.current.setValue(val)
    }

	function runner() {
		if(!isRunning) {
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
    useEffect(()=>{
        let data
        const fetchCode = async () => {
            data = await fetch(`http://localhost:8787/project/${slug}`, {
                method: 'GET',
            })
            data = await data.json()
            if(!data.success) {
                router.push('/error')
            }
            console.log(data.response.content)
            // TODO: FETCH S3 FILE AND UNZIP
            setLoadedCode(data.response.content)
            setValue(data.response.content)
        }
        fetchCode()
    },[])

	return (
		<div>
			<main>
				<button className="p-4 bg-green-600 text-white" onClick={runner}>{isRunning ? "Stop" : "Run"}</button>
				<div className="flex flex-row">
					<Editor height="90vh" defaultLanguage="python" theme="vs-dark" options={{
						minimap: {
						enabled: false,
						},
      				}} defaultValue={loadedCode} onMount={handleEditorDidMount}/>
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
  