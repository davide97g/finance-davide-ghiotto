/** Singleton documents; today only `categoryUsage`. */
import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/client";
import { settings } from "../db/schema";
import { publish } from "../lib/realtime";

export const settingsRoutes = new Hono();

settingsRoutes.get("/:key", async (c) => {
	const [row] = await db
		.select()
		.from(settings)
		.where(eq(settings.key, c.req.param("key")))
		.limit(1);
	if (!row) return c.json(null);
	return c.json(row.value);
});

settingsRoutes.put("/:key", async (c) => {
	const key = c.req.param("key");
	const value = await c.req.json();

	await db
		.insert(settings)
		.values({ key, value, updatedAt: new Date() })
		.onConflictDoUpdate({
			target: settings.key,
			set: { value, updatedAt: new Date() },
		});

	publish("settings", "update");
	return c.json(value);
});
