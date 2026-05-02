"use client"
import { useState, useRef, useEffect } from "react"
import PygameTerminal from "../../components/PygameTerminal"
import { Editor } from "@monaco-editor/react"
import { Panel, Group as PanelGroup, Separator as PanelResizeHandle } from "react-resizable-panels"
import { PlayIcon, StopIcon } from "@radix-ui/react-icons"

export default function Home() {
	const editorRef = useRef(null)
	const canvasRef = useRef(null)
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

	useEffect(() => {
		const handleKeyDown = (e) => {
			if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
				e.preventDefault();
				runner();
			}
		};
		// Set useCapture to true so we intercept the keydown before Monaco editor stops propagation
		document.addEventListener('keydown', handleKeyDown, true);
		return () => {
			document.removeEventListener('keydown', handleKeyDown, true);
		};
	}, [isRunning, runCode]);

	let defaultCode = `import pygame
import asyncio

async def main():
    pygame.init()
    screen = pygame.display.set_mode((400, 400))
    pygame.display.set_caption("Hello Pygame")
    
    running = True
    clock = pygame.time.Clock()
    x = 175
    y = 175
    speed = 4
    
    while running:
        for event in pygame.event.get():
            if event.type == pygame.QUIT:
                running = False
        
        # Handle continuous key presses
        keys = pygame.key.get_pressed()
        if keys[pygame.K_LEFT]:
            x -= speed
        if keys[pygame.K_RIGHT]:
            x += speed
        if keys[pygame.K_UP]:
            y -= speed
        if keys[pygame.K_DOWN]:
            y += speed
            
        # Draw everything
        screen.fill((30, 30, 30))
        pygame.draw.rect(screen, (80, 200, 120), (x, y, 50, 50))
        
        pygame.display.flip()
        
        # CRITICAL: You MUST yield to the browser or the tab will freeze!
        await asyncio.sleep(0) 
        clock.tick(60)

asyncio.ensure_future(main())
`

	return (
		<div className="h-screen w-screen flex flex-col bg-neutral-950 overflow-hidden">
			<header className="flex h-14 items-center justify-between px-6 border-b border-neutral-800 bg-neutral-900 shrink-0">
				<div className="flex items-center gap-4">
					<div className="flex h-6 w-6 items-center justify-center rounded-md bg-yellow-500 text-neutral-900 font-bold text-xs">SDL</div>
					<h1 className="text-sm font-semibold text-neutral-200">game.py</h1>
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
				<PanelGroup orientation="horizontal" className="h-full">
					<Panel defaultSize={40} minSize={20} collapsible={true} className="flex flex-col h-full relative">
						<Editor 
							height="100%"
							defaultLanguage="python" 
							theme="vs-dark" 
							options={{
								minimap: { enabled: false },
								padding: { top: 16 },
								readOnly: isRunning
							}} 
							defaultValue={defaultCode} 
							onMount={handleEditorDidMount}
						/>
					</Panel>

					<PanelResizeHandle className="w-1.5 bg-neutral-900 hover:bg-neutral-800 transition-colors flex items-center justify-center shrink-0 group z-10 cursor-col-resize">
						<div className="h-8 w-0.5 bg-neutral-600 group-hover:bg-neutral-400 rounded-full transition-colors" />
					</PanelResizeHandle>

					<Panel defaultSize={60} minSize={30} collapsible={true} className="flex flex-col h-full bg-[#1a1c1f]">
                        <PanelGroup orientation="vertical" className="h-full">
                            <Panel defaultSize={70} minSize={20} collapsible={true} className="flex flex-col relative bg-black">
                                <div className="absolute top-2 left-4 text-xs text-neutral-500 uppercase tracking-wider font-semibold z-10">Pygame Canvas</div>
                                <div className="flex items-center justify-center w-full h-full overflow-hidden">
                                    {/* Focusable canvas for capturing keyboard events natively */}
                                    <canvas id="canvas" ref={canvasRef} tabIndex="0" className="outline-none shadow-2xl" onContextMenu={(e) => e.preventDefault()}></canvas>
                                </div>
                            </Panel>

                            <PanelResizeHandle className="h-1.5 bg-neutral-900 hover:bg-neutral-800 transition-colors flex items-center justify-center shrink-0 group z-10 cursor-row-resize">
                                <div className="w-8 h-0.5 bg-neutral-600 group-hover:bg-neutral-400 rounded-full transition-colors" />
                            </PanelResizeHandle>

                            <Panel defaultSize={30} minSize={15} collapsible={true} className="flex flex-col p-4 relative">
                                <div className="text-xs text-neutral-500 mb-2 uppercase tracking-wider font-semibold shrink-0">Terminal Output</div>
                                <div className="flex-1 min-h-0 w-full relative">
                                    <div className="absolute inset-0">
                                        <PygameTerminal
                                            runCode={runCode}
                                            enabled={enabled}
                                            setEnabled={setEnabled}
                                            isRunning={isRunning}
                                            setIsRunning={setIsRunning}
                                            canvasRef={canvasRef}
                                        />
                                    </div>
                                </div>
                            </Panel>
                        </PanelGroup>
					</Panel>
				</PanelGroup>
			</main>
		</div>
	);
}
