export const GetAllUserProjects = async (c: any) => {

	const { user } = c.req.param()

	console.log(user)

	const { results } = await c.env.DB.prepare(`
		SELECT
		Projects.id, title, lang, content, owner_id, project_slug, Projects.created_at, updated_at, Users.username, Users.email
		FROM Projects
		INNER JOIN Users ON Users.id=Projects.owner_id
		WHERE owner_id=?;
	`).bind(user).all()

	if(results.length > 0) {
		return c.json({
			success: true,
			response: await results,
		})
	} else {
		c.status(400)
		return c.json({
			success: false,
			response: await results,
		})
	}
}

/*
id INTEGER PRIMARY KEY AUTOINCREMENT,
    title VARCHAR(255),
    lang VARCHAR(50),
    content TEXT,
    owner_id INTEGER REFERENCES Users(id),
    project_slug TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP*/