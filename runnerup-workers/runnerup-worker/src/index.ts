import { Hono } from "hono";
//import { fromHono } from "chanfana";
import { cors } from 'hono/cors'

import { GetProject } from "./endpoints/GetProject";
// import { JoinProject } from "./endpoints/JoinProject";

import { GetAllUserProjects } from "./endpoints/GetAllUserProjects";
import { GetUserProject } from "./endpoints/GetUserProject";

// import { CreateProject } from "./endpoints/CreateProject";
// import { DeleteProject } from "./endpoints/DeleteProject";

import { auth, login, logout } from "./util/auth"
import { CreateUser } from "./endpoints/CreateUser"
import { LoginUser } from "./endpoints/LoginUser"

// This ensures c.env.DB is correctly typed
type Bindings = {
  DB: D1Database;
};

const api = new Hono<{ Bindings: Bindings }>();
api.use("*", cors())

// Accessing D1 is via the c.env.YOUR_BINDING property
// api.get("/query/users/:id", async (c) => {
//   const userId = c.req.param("id");
//   try {
//     let { results } = await c.env.DB.prepare(
//       "SELECT * FROM users WHERE user_id = ?",
//     )
//       .bind(userId)
//       .all();
//     return c.json(results);
//   } catch (e) {
//     return c.json({ err: e.message }, 500);
//   }
// });

// Public endpoints
api.get("/project/:projectSlug", GetProject);
// api.post("/project/:projectSlug/join", JoinProject);

// User Specific Actions (to be authenticated)
//api.use("/q/*", auth)

// Get project and user's projects
api.get("/q/:user/projects", GetAllUserProjects);
api.get("/q/:user/:projectSlug", GetUserProject);
// api.delete("/q/:user/:projectSlug", DeleteProject);

// Create a Project
// api.post("/q/:user/project", CreateProject);

// Auth
api.post("/register", CreateUser)
api.post("/login", login, (c) => { return c.json( { message:"You Logged in as " + c.req.parseBody().then((body)=>body.username) + "!"}) } )
api.get("/logout", logout, (c) => { return c.json( { message:"You Logged out!"}) } )

// Export the Hono app
export default api;