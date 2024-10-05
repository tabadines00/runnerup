export const CreateProject = async (c: any) => {
	const db_url = c.env.DB_URL
	const db_key = c.env.DB_KEY

	// Get validated data
	const data = await c.req.parseBody()

	// Retrieve the validated request body
	const listToCreate = data.body;

	const res = {}

	// return the new task
	return {
		success: true,
		// list: {
		// 	name: res.name,
		// 	id: res.id,
		// 	description: res.description,
		// 	open: res.open,
		// 	due_date: res.due_date,
		// 	xata_createdAt: res.xata_createdAt,
		// 	owner: res.owner
		// },
	}
}
