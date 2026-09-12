import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/client";
import { recurring } from "../db/schema";
import { newId } from "../lib/id";
import { publish } from "../lib/realtime";
import { toRecurring } from "../lib/serialize";

export const recurringRoutes = new Hono();

interface RecurringBody {
	description: string;
	amount: number;
	category: string;
	type: "expense" | "earning";
	tag?: string | null;
	dayOfMonth: number;
	active: boolean;
	lastPeriod: string;
	createdAt?: number;
}

const toRow = (body: RecurringBody, id: string) => ({
	id,
	description: body.description,
	amount: body.amount.toFixed(2),
	categoryId: body.category,
	type: body.type,
	tagId: body.tag || null,
	dayOfMonth: body.dayOfMonth,
	active: body.active,
	lastPeriod: body.lastPeriod,
	createdAt: body.createdAt ?? Date.now(),
});

recurringRoutes.get("/", async (c) => {
	const rows = await db.select().from(recurring);
	return c.json(rows.map(toRecurring));
});

recurringRoutes.post("/", async (c) => {
	const body = await c.req.json<RecurringBody>();
	const [row] = await db
		.insert(recurring)
		.values(toRow(body, newId()))
		.returning();
	publish("recurring", "create");
	return c.json(toRecurring(row), 201);
});

recurringRoutes.put("/:id", async (c) => {
	const id = c.req.param("id");
	const { id: _ignored, ...values } = toRow(
		await c.req.json<RecurringBody>(),
		id,
	);
	const [row] = await db
		.update(recurring)
		.set(values)
		.where(eq(recurring.id, id))
		.returning();
	if (!row) return c.json({ error: "not found" }, 404);

	publish("recurring", "update");
	return c.json(toRecurring(row));
});

recurringRoutes.delete("/:id", async (c) => {
	const [row] = await db
		.delete(recurring)
		.where(eq(recurring.id, c.req.param("id")))
		.returning();
	if (!row) return c.json({ error: "not found" }, 404);

	publish("recurring", "delete");
	return c.json({ ok: true });
});
