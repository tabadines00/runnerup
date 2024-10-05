export const GetUserProject = async (c: any) => {
	const { user, projectSlug } = c.req.param()

	console.log(user, projectSlug)
	const { results } = await c.env.DB.prepare(`SELECT * FROM Projects WHERE owner_id=? AND project_slug=?;`).bind(user,projectSlug).all()

	console.log(results)
	const res = results[0]

	return c.json({
		success: true,
		response: await res,
	})
}
