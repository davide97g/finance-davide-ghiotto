import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/client";
import { categories } from "../db/schema";
import { newId } from "../lib/id";
import { publish } from "../lib/realtime";
import { toCategory } from "../lib/serialize";

export const categoryRoutes = new Hono();

interface CategoryBody {
	name: string;
	type: "expense" | "earning";
	color?: string | null;
	description?: string | null;
	excludeFromBudget?: boolean;
}

const toRow = (body: CategoryBody, id: string) => ({
	id,
	name: body.name,
	type: body.type,
	color: body.color || null,
	description: body.description || null,
	excludeFromBudget: body.excludeFromBudget ?? false,
});

categoryRoutes.get("/", async (c) => {
	const type = c.req.query("type");
	const rows = await db
		.select()
		.from(categories)
		.where(
			type ? eq(categories.type, type as "expense" | "earning") : undefined,
		);
	return c.json(rows.map(toCategory));
});

categoryRoutes.post("/", async (c) => {
	const body = await c.req.json<CategoryBody>();
	const [row] = await db
		.insert(categories)
		.values(toRow(body, newId()))
		.returning();
	publish("categories", "create");
	return c.json(toCategory(row), 201);
});

categoryRoutes.put("/:id", async (c) => {
	const id = c.req.param("id");
	const { id: _ignored, ...values } = toRow(
		await c.req.json<CategoryBody>(),
		id,
	);
	const [row] = await db
		.update(categories)
		.set(values)
		.where(eq(categories.id, id))
		.returning();
	if (!row) return c.json({ error: "not found" }, 404);

	publish("categories", "update");
	return c.json(toCategory(row));
});

categoryRoutes.delete("/:id", async (c) => {
	try {
		const [row] = await db
			.delete(categories)
			.where(eq(categories.id, c.req.param("id")))
			.returning();
		if (!row) return c.json({ error: "not found" }, 404);

		publish("categories", "delete");
		return c.json({ ok: true });
	} catch (error) {
		// Firestore let a category vanish under its transactions; Postgres does not.
		return c.json(
			{
				error: "category is still used by transactions or recurring templates",
				detail: `${error}`,
			},
			409,
		);
	}
});
