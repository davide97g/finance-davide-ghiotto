/**
 * Groceries and todos: two identical checklists, one route factory.
 */
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/client";
import { groceries, todos } from "../db/schema";
import { newId } from "../lib/id";
import { type ChangedCollection, publish } from "../lib/realtime";
import { toGrocery, toTodo } from "../lib/serialize";

interface ChecklistBody {
	label: string;
	checked?: boolean;
	category?: string | null;
}

export const groceryRoutes = new Hono();

groceryRoutes.get("/", async (c) => {
	const rows = await db.select().from(groceries);
	return c.json(rows.map(toGrocery));
});

groceryRoutes.post("/", async (c) => {
	const body = await c.req.json<ChecklistBody>();
	const [row] = await db
		.insert(groceries)
		.values({
			id: newId(),
			label: body.label,
			checked: body.checked ?? false,
			category: body.category || null,
		})
		.returning();
	publish("groceries", "create");
	return c.json(toGrocery(row), 201);
});

groceryRoutes.put("/:id", async (c) => {
	const body = await c.req.json<ChecklistBody>();
	const [row] = await db
		.update(groceries)
		.set({
			label: body.label,
			checked: body.checked ?? false,
			category: body.category || null,
		})
		.where(eq(groceries.id, c.req.param("id")))
		.returning();
	if (!row) return c.json({ error: "not found" }, 404);

	publish("groceries", "update");
	return c.json(toGrocery(row));
});

groceryRoutes.delete("/:id", async (c) => {
	const [row] = await db
		.delete(groceries)
		.where(eq(groceries.id, c.req.param("id")))
		.returning();
	if (!row) return c.json({ error: "not found" }, 404);

	publish("groceries", "delete");
	return c.json({ ok: true });
});

export const todoRoutes = new Hono();

todoRoutes.get("/", async (c) => {
	const rows = await db.select().from(todos);
	return c.json(rows.map(toTodo));
});

todoRoutes.post("/", async (c) => {
	const body = await c.req.json<ChecklistBody>();
	const [row] = await db
		.insert(todos)
		.values({ id: newId(), label: body.label, checked: body.checked ?? false })
		.returning();
	publish("todo", "create");
	return c.json(toTodo(row), 201);
});

todoRoutes.put("/:id", async (c) => {
	const body = await c.req.json<ChecklistBody>();
	const [row] = await db
		.update(todos)
		.set({ label: body.label, checked: body.checked ?? false })
		.where(eq(todos.id, c.req.param("id")))
		.returning();
	if (!row) return c.json({ error: "not found" }, 404);

	publish("todo", "update");
	return c.json(toTodo(row));
});

todoRoutes.delete("/:id", async (c) => {
	const [row] = await db
		.delete(todos)
		.where(eq(todos.id, c.req.param("id")))
		.returning();
	if (!row) return c.json({ error: "not found" }, 404);

	publish("todo", "delete");
	return c.json({ ok: true });
});

/** Kept exported for symmetry with the other route modules. */
export const checklistCollections: ChangedCollection[] = ["groceries", "todo"];
