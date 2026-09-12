import { and, eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/client";
import { transactions } from "../db/schema";
import { newId } from "../lib/id";
import { publish } from "../lib/realtime";
import { toTransaction } from "../lib/serialize";

export const transactionRoutes = new Hono();

interface TransactionBody {
	date: string;
	month: string;
	year: string;
	amount: number;
	description?: string;
	category: string;
	type: "expense" | "earning";
	tag?: string | null;
	recurringId?: string | null;
	createdAt?: number;
}

const toRow = (body: TransactionBody, id: string) => ({
	id,
	date: body.date,
	month: body.month,
	year: body.year,
	amount: body.amount.toFixed(2),
	description: body.description ?? "",
	categoryId: body.category,
	type: body.type,
	tagId: body.tag || null,
	recurringId: body.recurringId || null,
	createdAt: body.createdAt ?? Date.now(),
});

transactionRoutes.get("/", async (c) => {
	const { type, month, year } = c.req.query();
	const filters = [
		type ? eq(transactions.type, type as "expense" | "earning") : undefined,
		month ? eq(transactions.month, month) : undefined,
		year ? eq(transactions.year, year) : undefined,
	].filter(Boolean);

	const rows = await db
		.select()
		.from(transactions)
		.where(filters.length ? and(...filters) : undefined);
	return c.json(rows.map(toTransaction));
});

transactionRoutes.post("/", async (c) => {
	const body = await c.req.json<TransactionBody>();
	const [row] = await db
		.insert(transactions)
		.values(toRow(body, newId()))
		.returning();
	publish("transactions", "create");
	return c.json(toTransaction(row), 201);
});

/** Bulk insert backing `DataBaseClient.Transaction.bulkAdd`. */
transactionRoutes.post("/bulk", async (c) => {
	const body = await c.req.json<TransactionBody[]>();
	if (!body.length) return c.json([]);

	const rows = await db
		.insert(transactions)
		.values(body.map((item) => toRow(item, newId())))
		.returning();
	publish("transactions", "create");
	return c.json(rows.map(toTransaction), 201);
});

transactionRoutes.put("/:id", async (c) => {
	const id = c.req.param("id");
	const body = await c.req.json<TransactionBody>();
	const { id: _ignored, ...values } = toRow(body, id);

	const [row] = await db
		.update(transactions)
		.set(values)
		.where(eq(transactions.id, id))
		.returning();
	if (!row) return c.json({ error: "not found" }, 404);

	publish("transactions", "update");
	return c.json(toTransaction(row));
});

transactionRoutes.delete("/:id", async (c) => {
	const [row] = await db
		.delete(transactions)
		.where(eq(transactions.id, c.req.param("id")))
		.returning();
	if (!row) return c.json({ error: "not found" }, 404);

	publish("transactions", "delete");
	return c.json({ ok: true });
});
