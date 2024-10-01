"use client"

import { useEffect, useState } from "react"

export default function Home() {

	const [atag, setAtag] = useState({
		href: "",
		download: "",
		textContent: "",
	})
	const createBlob = (ev) => {
		ev.preventDefault()
		let ab = new ArrayBuffer(2) // 2 bytes
		let dataview = new DataView(ab)
		dataview.setInt8(0, 104)
		dataview.setInt8(1, 105)
		console.log(new Uint8Array(ab).toString())

		let b = new Blob([ab])
		console.log(b)

		let f = new File([ab], 'myinfo.txt', {type: 'text/plain'})
		console.log(f)

		let url = URL.createObjectURL(f)
		setAtag({
			href: url,
			download: f.name,
			textContent: `Download ${f.name}`,
		})
	}

	useEffect(() => {

	}, [])
	
	return (
		<div>
		<main>
			<button onClick={createBlob}>createblob</button>
			<a href={atag.href} download={atag.download}>{atag.textContent}</a>
		</main>
		</div>
	);
}
