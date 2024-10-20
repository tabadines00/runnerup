import { Hono } from 'hono'
import {
  getCookie,
  getSignedCookie,
  setCookie,
  setSignedCookie,
  deleteCookie,
} from 'hono/cookie'

//import { loginHandler, logoutHandler, authCheck } from "../model/model"

export const auth = async (c: any, next: any) => {
	//deleteCookie(c, 'session')
	const session = getCookie(c, 'sess-id')
	const sessionID = session?.split(" ")[2]
	console.log(sessionID)
	let sess = null

	if (sessionID) {
		// Save session in db
		const { results } = await c.env.DB.prepare(`SELECT * FROM Sessions WHERE session_id=?;`).bind(sessionID).all();
		console.log(results)
		sess = results
	}

	//const cookieHeader = c.req.raw
  	//console.log('Headers:', cookieHeader);

	if (!sess) {
		return c.json({ error: 'Unauthorized', ok: false }, 401)	
	} else {
		await next()
	}
}

export const login = async (c: any, next: any) => {
//	const sessionCookie = getCookie(c, 'session')
//	if (sessionCookie) {
//		await next()
//	} else {
//			
//	}
	//setCookie(c, 'session', 'macha')
	//deleteCookie(c, 'session')
	const authHeader = false//await c.req.header('Authorization')

	const user = await c.req.json()

    // Retrieve the validated request body
	console.log(user)
	
	if (!authHeader) {
		const { results } = await c.env.DB.prepare(`SELECT * FROM Users WHERE email=? AND password_hash=?;`).bind(user.email, user.password_hash).all();
		//console.log(results)
		if(results) {
			const data = results[0]
			console.log(data)
			console.log("Hello, " + data.email + "! You Signed in!")
			c.header('Authorization', data.session)
			// Set cookies too?
		} else {
			console.log("couldn't log in")
			return c.json({error:'Incorrect Username or Password', ok: false}, 400)
		}
	}
	await next()
}

export const logout = async (c: any, next: any) => {
	//const db_url = c.env.DB_URL
    //const db_key = c.env.DB_KEY
//	const sessionCookie = getCookie(c, 'session')
//	if (sessionCookie) {
//		await next()
//	} else {
//			
//	}
	//setCookie(c, 'session', 'macha')
	deleteCookie(c, 'sess-id')
	const cookieHeader = await c.req.header('Cookie')
	if (cookieHeader) {
		console.log("Goodbye! You Signed out!")
		c.header('Cookie', null)
	} else {
		console.log("Oops! Not currently logged in!")
	}
	await next()
}
