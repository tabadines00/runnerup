

import { React } from 'react'
import Dashboard from '@/app/components/Dashboard'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

async function Page({params: {slug}}) {
	const cookieStore = cookies()
	let sessCookie = cookieStore.get('sess-id')
	let cookieVal = sessCookie.value
  	let uname = cookieVal.split(" ")[1]

	let data = await fetch("http://localhost:8787/q/"+slug+"/projects", {
		method: 'GET',
		credentials: 'include',
		headers: {
			Cookie: `sess-id=${cookieVal};`
		}
	})

	let projects = await data.json()
	if(projects.success && projects.response[0].username) {
		console.log(projects.response)
		return (
			<div className='p-4'>
				<p className='text-xl'>{projects.response[0].username}&apos;s Projects</p>
				<Dashboard dashboardProjects={projects.response}/>
			</div>
		)
	} else {
		return (
			<div className='p-4'>
				<p className='text-xl'>User not found...</p>
			</div>
		)
	}
}

export default Page