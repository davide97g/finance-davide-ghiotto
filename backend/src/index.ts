/**
 * Finance API.
 *
 * Replaces the direct browser-to-Firestore access with a single service in
 * front of Postgres: REST for reads and writes, SSE for the change feed the
 * frontend's `getRT()` subscribes to.
 */
import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import { streamSSE } from "hono/streaming";
import { currentUser, requireAuth } from "./lib/auth";
import { subscribe } from "./lib/realtime";
import { authRoutes } from "./routes/auth";
import { categoryRoutes } from "./routes/categories";
import { groceryRoutes, todoRoutes } from "./routes/checklists";
import { recurringRoutes } from "./routes/recurring";
import { settingsRoutes } from "./routes/settings";
import { statsRoutes } from "./routes/stats";
import { tagRoutes } from "./routes/tags";
import { transactionRoutes } from "./routes/transactions";

const app = new Hono();

app.use("*", logger());

const origins = (process.env.CORS_ORIGINS ?? "http://localhost:8080")
	.split(",")
	.map((origin) => origin.trim())
	.filter(Boolean);

app.use(
	"/api/*",
	cors({
		origin: origins,
		credentials: true,
		allowHeaders: ["Content-Type", "Authorization", "X-Client-Id"],
		allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
	}),
);

/** Probe for Dokploy / compose healthchecks. */
app.get("/health", (c) => c.json({ ok: true }));

app.route("/api/auth", authRoutes);

/**
 * Change feed. The client reconnects on its own (EventSource does), so the
 * only state here is the subscriber set; a reconnect just re-runs the fetch.
 */
app.get("/api/events", async (c) => {
	const user = await currentUser(c);
	if (!user) return c.json({ error: "unauthorized" }, 401);

	return streamSSE(c, async (stream) => {
		let open = true;
		stream.onAbort(() => {
			open = false;
		});

		const unsubscribe = subscribe((event) => {
			stream
				.writeSSE({ event: "change", data: JSON.stringify(event) })
				.catch(() => {
					open = false;
				});
		});

		await stream.writeSSE({ event: "ready", data: "{}" });

		// Comment heartbeats keep reverse proxies from closing an idle stream.
		while (open) {
			await stream.sleep(25_000);
			if (!open) break;
			await stream.writeSSE({ event: "ping", data: `${Date.now()}` });
		}
		unsubscribe();
	});
});

app.use("/api/*", requireAuth);
app.route("/api/transactions", transactionRoutes);
app.route("/api/categories", categoryRoutes);
app.route("/api/tags", tagRoutes);
app.route("/api/recurring", recurringRoutes);
app.route("/api/stats", statsRoutes);
app.route("/api/groceries", groceryRoutes);
app.route("/api/todo", todoRoutes);
app.route("/api/settings", settingsRoutes);

const port = Number(process.env.PORT ?? 3000);
console.log(`finance api listening on :${port}`);

export default {
	port,
	fetch: app.fetch,
	// SSE streams must outlive Bun's default idle timeout.
	idleTimeout: 255,
};
