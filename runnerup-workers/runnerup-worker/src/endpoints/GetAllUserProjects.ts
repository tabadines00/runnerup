export const GetAllUserProjects = async (c: any) => {

	const { user } = c.req.param()

	console.log(user)

	const { results } = await c.env.DB.prepare(`SELECT * FROM Projects WHERE owner_id=?;`).bind(user).all()

	return c.json({
		success: true,
		response: await results,
	})
}
