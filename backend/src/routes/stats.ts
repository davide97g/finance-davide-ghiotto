import { and, eq, inArray } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/client";
import { stats, statsCategories } from "../db/schema";
import { newId } from "../lib/id";
import { publish } from "../lib/realtime";
import { toStats } from "../lib/serialize";

export const statsRoutes = new Hono();

interface StatsBody {
	month: string;
	year: string;
	total: number;
	type: "expense" | "earning";
	lastUpdate: string;
	categorySummary: { categoryId: string; total: number }[];
}

/** Loads the per-category rows for a set of frozen months in one query. */
const withSummaries = async (rows: (typeof stats.$inferSelect)[]) => {
	if (!rows.length) return [];
	const summaries = await db
		.select()
		.from(statsCategories)
		.where(
			inArray(
				statsCategories.statsId,
				rows.map((row) => row.id),
			),
		);
	return rows.map((row) =>
		toStats(
			row,
			summaries.filter((summary) => summary.statsId === row.id),
		),
	);
};

const insert = async (body: StatsBody) => {
	const id = newId();
	const [row] = await db
		.insert(stats)
		.values({
			id,
			month: body.month,
			year: body.year,
			total: body.total.toFixed(2),
			type: body.type,
			lastUpdate: body.lastUpdate,
		})
		.returning();

	const summary = (body.categorySummary ?? []).map((entry) => ({
		statsId: id,
		categoryId: entry.categoryId,
		total: entry.total.toFixed(2),
	}));
	if (summary.length) await db.insert(statsCategories).values(summary);

	return toStats(row, summary);
};

statsRoutes.get("/", async (c) => {
	const { month, year } = c.req.query();
	const filters = [
		month ? eq(stats.month, month) : undefined,
		year ? eq(stats.year, year) : undefined,
	].filter(Boolean);

	const rows = await db
		.select()
		.from(stats)
		.where(filters.length ? and(...filters) : undefined);
	return c.json(await withSummaries(rows));
});

statsRoutes.post("/", async (c) => {
	const created = await insert(await c.req.json<StatsBody>());
	publish("stats", "create");
	return c.json(created, 201);
});

/** Bulk insert backing `DataBaseClient.Stats.bulkAdd`. */
statsRoutes.post("/bulk", async (c) => {
	const body = await c.req.json<StatsBody[]>();
	const created = [];
	for (const item of body) created.push(await insert(item));
	publish("stats", "create");
	return c.json(created, 201);
});

/** Bulk delete backing `DataBaseClient.Stats.bulkDelete`. */
statsRoutes.post("/bulk-delete", async (c) => {
	const { ids } = await c.req.json<{ ids: string[] }>();
	if (ids?.length) await db.delete(stats).where(inArray(stats.id, ids));
	publish("stats", "delete");
	return c.json({ ok: true });
});

statsRoutes.put("/:id", async (c) => {
	const id = c.req.param("id");
	const body = await c.req.json<StatsBody>();

	const [row] = await db
		.update(stats)
		.set({
			month: body.month,
			year: body.year,
			total: body.total.toFixed(2),
			type: body.type,
			lastUpdate: body.lastUpdate,
		})
		.where(eq(stats.id, id))
		.returning();
	if (!row) return c.json({ error: "not found" }, 404);

	// The summary is replaced wholesale: it is a frozen snapshot, not a delta.
	await db.delete(statsCategories).where(eq(statsCategories.statsId, id));
	if (body.categorySummary?.length) {
		await db.insert(statsCategories).values(
			body.categorySummary.map((summary) => ({
				statsId: id,
				categoryId: summary.categoryId,
				total: summary.total.toFixed(2),
			})),
		);
	}

	publish("stats", "update");
	const [updated] = await withSummaries([row]);
	return c.json(updated);
});

statsRoutes.delete("/:id", async (c) => {
	const [row] = await db
		.delete(stats)
		.where(eq(stats.id, c.req.param("id")))
		.returning();
	if (!row) return c.json({ error: "not found" }, 404);

	publish("stats", "delete");
	return c.json({ ok: true });
});
