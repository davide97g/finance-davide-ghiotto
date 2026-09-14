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
import {
	checkLoginAllowed,
	clientIp,
	recordAttempt,
	recordFailure,
	recordSuccess,
	remainingAttempts,
} from "../lib/rate-limit";
import { toUser } from "../lib/serialize";

export const authRoutes = new Hono();

authRoutes.post("/login", async (c) => {
	const { email: rawEmail, password } = await c.req.json<{
		email?: string;
		password?: string;
	}>();
	if (!rawEmail || !password)
		return c.json({ error: "email and password are required" }, 400);

	const email = rawEmail.trim().toLowerCase();
	const ip = clientIp(c);

	const limit = checkLoginAllowed(email, ip);
	if (!limit.allowed) {
		c.header("Retry-After", `${limit.retryAfter}`);
		return c.json(
			{
				error:
					limit.reason === "account"
						? "too many failed attempts for this account"
						: "too many login attempts from this address",
				retryAfter: limit.retryAfter,
			},
			429,
		);
	}
	recordAttempt(ip);

	const [row] = await db
		.select()
		.from(users)
		.where(eq(users.email, email))
		.limit(1);

	// Same response whether the account is missing or the password is wrong,
	// and a miss counts too: otherwise the lock would confirm which emails exist.
	if (!row || !(await verifyPassword(password, row.passwordHash))) {
		const lockedFor = recordFailure(email);
		if (lockedFor) {
			console.warn(`login locked for ${email} (${ip}) for ${lockedFor}s`);
			c.header("Retry-After", `${lockedFor}`);
			return c.json(
				{
					error: "too many failed attempts for this account",
					retryAfter: lockedFor,
				},
				429,
			);
		}
		console.warn(
			`failed login for ${email} (${ip}), ${remainingAttempts(email)} left`,
		);
		return c.json({ error: "invalid credentials" }, 401);
	}

	recordSuccess(email);
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
