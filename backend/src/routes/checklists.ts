/**
 * Groceries and todos: two identical checklists, one route factory.
 */
import { eq } from "drizzle-orm";
import type { Context } from "hono";
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

/** Partial body for `PATCH`: only the keys present are written. */
interface ChecklistPatch {
	label?: string;
	checked?: boolean;
	category?: string | null;
}

/** Identifies the tab that wrote, so its own change event can skip its re-read. */
const originOf = (c: Context) => c.req.header("X-Client-Id") || undefined;

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
	publish("groceries", "create", originOf(c));
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

	publish("groceries", "update", originOf(c));
	return c.json(toGrocery(row));
});

/**
 * Ticking a box off in a shop is the one write that has to feel instant, so it
 * gets its own verb: the client sends `{ checked }` alone, nothing else on the
 * row can be clobbered by a stale copy, and the updated row comes straight
 * back — the caller applies it without waiting for a re-read.
 */
groceryRoutes.patch("/:id", async (c) => {
	const body = await c.req.json<ChecklistPatch>();
	const patch: ChecklistPatch = {};
	if (body.label !== undefined) patch.label = body.label;
	if (body.checked !== undefined) patch.checked = body.checked;
	if (body.category !== undefined) patch.category = body.category || null;

	if (Object.keys(patch).length === 0) {
		const [row] = await db
			.select()
			.from(groceries)
			.where(eq(groceries.id, c.req.param("id")));
		return row ? c.json(toGrocery(row)) : c.json({ error: "not found" }, 404);
	}

	const [row] = await db
		.update(groceries)
		.set(patch)
		.where(eq(groceries.id, c.req.param("id")))
		.returning();
	if (!row) return c.json({ error: "not found" }, 404);

	publish("groceries", "update", originOf(c));
	return c.json(toGrocery(row));
});

groceryRoutes.delete("/:id", async (c) => {
	const [row] = await db
		.delete(groceries)
		.where(eq(groceries.id, c.req.param("id")))
		.returning();
	if (!row) return c.json({ error: "not found" }, 404);

	publish("groceries", "delete", originOf(c));
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
	publish("todo", "create", originOf(c));
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

	publish("todo", "update", originOf(c));
	return c.json(toTodo(row));
});

/** See the grocery `PATCH`: partial write, updated row straight back. */
todoRoutes.patch("/:id", async (c) => {
	const body = await c.req.json<ChecklistPatch>();
	const patch: { label?: string; checked?: boolean } = {};
	if (body.label !== undefined) patch.label = body.label;
	if (body.checked !== undefined) patch.checked = body.checked;

	if (Object.keys(patch).length === 0) {
		const [row] = await db
			.select()
			.from(todos)
			.where(eq(todos.id, c.req.param("id")));
		return row ? c.json(toTodo(row)) : c.json({ error: "not found" }, 404);
	}

	const [row] = await db
		.update(todos)
		.set(patch)
		.where(eq(todos.id, c.req.param("id")))
		.returning();
	if (!row) return c.json({ error: "not found" }, 404);

	publish("todo", "update", originOf(c));
	return c.json(toTodo(row));
});

todoRoutes.delete("/:id", async (c) => {
	const [row] = await db
		.delete(todos)
		.where(eq(todos.id, c.req.param("id")))
		.returning();
	if (!row) return c.json({ error: "not found" }, 404);

	publish("todo", "delete", originOf(c));
	return c.json({ ok: true });
});

/** Kept exported for symmetry with the other route modules. */
export const checklistCollections: ChangedCollection[] = ["groceries", "todo"];
