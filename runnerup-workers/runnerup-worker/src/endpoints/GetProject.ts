export const GetProject = async (c: any) => {
	const { projectSlug } = c.req.param()

	console.log(projectSlug)

	const { results } = await c.env.DB.prepare(`SELECT * FROM Projects WHERE project_slug=?;`).bind(projectSlug).all()

	console.log(results[0])

	return await c.json({
		success: true,
		response: await results[0],
	})
}
