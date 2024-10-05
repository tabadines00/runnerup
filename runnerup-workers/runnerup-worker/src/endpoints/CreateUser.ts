export const CreateUser = async (c: any) => {
    // Get validated data
    const data = await c.req.parseBody()

    // Retrieve the validated request body
    const userToCreate = data.body;

    // Implement your own object insertion here
    const { results } = await c.env.DB.prepare(`INSERT INTO Users (username, email, password_hash) VALUES (?, ?, ?);`)
        .bind(userToCreate.username, userToCreate.email, userToCreate.password_hash)
        .all();

    const res = results[0]

    // return the new user data if successful
    if (res) {
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
        c.status(500)
        return c.json({
            success: false,
            response: {
                error: "Unable to create account"
            }
        })
    }
}