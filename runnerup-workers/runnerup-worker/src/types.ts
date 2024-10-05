import { DateTime, Str } from "chanfana";
import { z } from "zod";

export const Task = z.object({
	name: Str({ example: "lorem" }),
	slug: Str(),
	description: Str({ required: false }),
	completed: z.boolean().default(false),
	due_date: DateTime(),
});

export const List = z.object({
	name: Str({ example: "lorem" }),
	id: Str(),
	description: Str({ required: false }),
	open: z.boolean().default(false),
	due_date: DateTime(),
});

export const Logins = z.object({
	name: Str(),
	id: Str(),
	description: Str({ required: false }),
	open: z.boolean().default(false)
});

export const Attendees = z.object({
	name: Str(),
	id: Str(),
	description: Str({ required: false }),
	open: z.boolean().default(false)
});





