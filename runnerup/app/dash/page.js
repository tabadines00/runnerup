'use client'
 
import { useRouter } from 'next/navigation'

import { React, useEffect, useState } from 'react'
import Dashboard from '@/app/components/Dashboard'
import { getCookie } from 'cookies-next'

import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

function Page({params: {slug}}) {
    const router = useRouter()
	//const cookieStore = useCookies()
	let init = false

	const [projects, setProjects] = useState({})
	//const [sessCookie, setSessCookie] = useState("")

	useEffect(()=>{
		if(init == false) {
			const fetchData = async () => {
				//let sessCookie = cookieStore.get('sess-id')
				//console.log(getCookie('sess-id'))
				let sessCookie = getCookie('sess-id')
				//console.log(sessCookie)
				let data = null

				if (!sessCookie) {
					router.push('/login')
				} else {
					//let cookieVal = sessCookie.value
					let cookieVal = sessCookie
					// let uname = cookieVal.value.split(" ")[1]
					let userID = sessCookie.split(" ")[0]

					data = await fetch("http://localhost:8787/q/"+userID+"/projects", {
						method: 'GET',
						credentials: 'include',
						headers: {
							Cookie: `sess-id=${cookieVal};`
						}
					})
					data = await data.json()
					setProjects(data)
				}

				return await data
			}
			fetchData()
			//setProjects(fetchData())
			init = true
		}
	}, [])

	
	if(projects.success && projects.response[0].username) {
		
		return (
			<SidebarProvider>
      			<AppSidebar />
				 <main>
					<SidebarTrigger />
					<div className='p-4'>
						<p className='text-xl'>Welcome back, {projects.response[0].username}</p>
						<Dashboard dashboardProjects={projects.response}/>
					</div>
      			</main>
			</SidebarProvider>
		)
	} else {
		return (
			<div className='p-4'>
				<p className='text-xl'>Loading...</p>
			</div>
		)
	}
}

export default Page