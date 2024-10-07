import {React} from 'react'
import Dashboard from '@/app/components/Dashboard'

async function page({params: {slug}}) {
	let data = await fetch("http://localhost:8787/q/"+slug+"/projects")
	let projects = await data.json()
	console.log(projects.response)
  	return (
    	<div className='p-4'>
        	<p className='text-xl'>{slug}'s Projects</p>
        	<Dashboard dashboardProjects={projects.response}/>
    	</div>
  	)
}

export default page