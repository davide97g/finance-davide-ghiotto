import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/client";
import { tags } from "../db/schema";
import { newId } from "../lib/id";
import { publish } from "../lib/realtime";
import { toTag } from "../lib/serialize";

export const tagRoutes = new Hono();

interface TagBody {
	name: string;
	color?: string | null;
	description?: string | null;
}

const toRow = (body: TagBody, id: string) => ({
	id,
	name: body.name,
	color: body.color || null,
	description: body.description || null,
});

tagRoutes.get("/", async (c) => {
	const rows = await db.select().from(tags);
	return c.json(rows.map(toTag));
});

tagRoutes.post("/", async (c) => {
	const body = await c.req.json<TagBody>();
	const [row] = await db.insert(tags).values(toRow(body, newId())).returning();
	publish("tags", "create");
	return c.json(toTag(row), 201);
});

tagRoutes.put("/:id", async (c) => {
	const id = c.req.param("id");
	const { id: _ignored, ...values } = toRow(await c.req.json<TagBody>(), id);
	const [row] = await db
		.update(tags)
		.set(values)
		.where(eq(tags.id, id))
		.returning();
	if (!row) return c.json({ error: "not found" }, 404);

	publish("tags", "update");
	return c.json(toTag(row));
});

tagRoutes.delete("/:id", async (c) => {
	const [row] = await db
		.delete(tags)
		.where(eq(tags.id, c.req.param("id")))
		.returning();
	if (!row) return c.json({ error: "not found" }, 404);

	publish("tags", "delete");
	return c.json({ ok: true });
});
