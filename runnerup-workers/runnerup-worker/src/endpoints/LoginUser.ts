import {v4 as uuid} from 'uuid';

//let myuuid = uuid();

import {
    getCookie,
    getSignedCookie,
    setCookie,
    setSignedCookie,
    deleteCookie,
} from 'hono/cookie'

export const LoginUser = async (c: any, next: any) => {
    // Get validated data
    const user = await c.req.json()

    // Retrieve the validated request body
    console.log(user)

    // Implement your own object insertion here
    const { results } = await c.env.DB.prepare(`SELECT * FROM Users WHERE email=? AND password_hash=?;`)
        .bind(user.email, user.password_hash)
        .all();

    const res = results[0]

    // return the user data if successful
    if (res) {

        // Login Successful
        console.log("Login Successful for user "+res.username)

        // Create new session ID
        let sessionID = uuid()
        console.log("Creating sessionID "+sessionID)

        // Save session in db
        const { results } = await c.env.DB.prepare(`INSERT INTO Sessions (user_id, session_id) VALUES (?, ?);`)
            .bind(res.id, sessionID)
            .all();
        console.log(results)
        const sess = results

        if(sess){
            console.log("Session was inserted into DB")
        } else {
            console.log("Session unable to add to DB")
        }

        // Set cookie for client
        setCookie(c, 'sess-id', res.id+" "+res.username+" "+sessionID, {
            path: '/',
            secure: false,
            domain: 'localhost',
            httpOnly: false,
            maxAge: 300,
            //expires: new Date(Date.UTC(2000, 11, 24, 10, 30, 59, 900)),
            sameSite: 'Lax',
          })
        console.log("set cookies for browser")

        c.status(201)
        return c.json({
            success: true,
            response: {
                username: res.username,
                id: res.id,
                email: res.email,
                created_at: res.created_at
            },
        })
    } else {

        // Login Unsuccessful

        c.status(500)
        return c.json({
            success: false,
            response: {
                error: "Unable to login account"
            }
        })
    }
}