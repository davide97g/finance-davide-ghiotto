/**
 * Creates a login, or resets the password of an existing one.
 *
 * Usage:
 *   bun run user:create <email> <password> [--name "Davide"] [--admin]
 */
import { eq } from "drizzle-orm";
import { db, sql } from "../db/client";
import { users } from "../db/schema";
import { hashPassword } from "../lib/auth";
import { newId } from "../lib/id";

const [emailArg, password, ...flags] = process.argv.slice(2);
if (!emailArg || !password) {
	console.error(
		'usage: bun run user:create <email> <password> [--name "Full Name"] [--admin]',
	);
	process.exit(1);
}

const email = emailArg.trim().toLowerCase();
const isAdmin = flags.includes("--admin");
const nameIndex = flags.indexOf("--name");
const displayName = nameIndex >= 0 ? flags[nameIndex + 1] : null;

const passwordHash = await hashPassword(password);
const [existing] = await db
	.select()
	.from(users)
	.where(eq(users.email, email))
	.limit(1);

if (existing) {
	await db
		.update(users)
		.set({
			passwordHash,
			isAdmin: isAdmin || existing.isAdmin,
			displayName: displayName ?? existing.displayName,
		})
		.where(eq(users.id, existing.id));
	console.log(`password updated for ${email}`);
} else {
	await db.insert(users).values({
		id: newId(28),
		email,
		passwordHash,
		displayName,
		isAdmin,
	});
	console.log(`user created: ${email}${isAdmin ? " (admin)" : ""}`);
}

await sql.end();
