import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { db } from "../db/client";
import { users } from "../db/schema";
import {
	clearSession,
	currentUser,
	issueSession,
	verifyPassword,
} from "../lib/auth";
import { toUser } from "../lib/serialize";

export const authRoutes = new Hono();

authRoutes.post("/login", async (c) => {
	const { email, password } = await c.req.json<{
		email?: string;
		password?: string;
	}>();
	if (!email || !password)
		return c.json({ error: "email and password are required" }, 400);

	const [row] = await db
		.select()
		.from(users)
		.where(eq(users.email, email.trim().toLowerCase()))
		.limit(1);

	// Same response whether the account is missing or the password is wrong.
	if (!row || !(await verifyPassword(password, row.passwordHash)))
		return c.json({ error: "invalid credentials" }, 401);

	await issueSession(c, {
		uid: row.id,
		email: row.email,
		isAdmin: row.isAdmin,
	});
	return c.json(toUser(row));
});

authRoutes.post("/logout", (c) => {
	clearSession(c);
	return c.json({ ok: true });
});

authRoutes.get("/me", async (c) => {
	const session = await currentUser(c);
	if (!session) return c.json({ error: "unauthorized" }, 401);

	const [row] = await db
		.select()
		.from(users)
		.where(eq(users.id, session.uid))
		.limit(1);
	if (!row) return c.json({ error: "unauthorized" }, 401);

	return c.json(toUser(row));
});
