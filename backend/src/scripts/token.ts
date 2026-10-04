/**
 * API tokens for other services, so they never need a password.
 *
 * Usage:
 *   bun run token create <name> [--scope read|write]   (default: read; prints the token once)
 *   bun run token list
 *   bun run token revoke <id>
 *
 * `write` tokens may only add, change and delete transactions.
 */
import { desc, eq } from "drizzle-orm";
import { db, sql } from "../db/client";
import { apiTokens } from "../db/schema";
import { createToken, type TokenScope } from "../lib/tokens";

const [command, arg, ...flags] = process.argv.slice(2);
const usage = () => {
	console.error(
		"usage: bun run token create <name> [--scope read|write] | list | revoke <id>",
	);
	process.exit(1);
};

if (command === "create" && arg) {
	const scopeIndex = flags.indexOf("--scope");
	const scope = (
		scopeIndex >= 0 ? flags[scopeIndex + 1] : "read"
	) as TokenScope;
	if (scope !== "read" && scope !== "write") usage();
	const { id, token } = await createToken(arg, scope);
	console.log(`token ${id} (${arg}, ${scope}) — shown only now:\n${token}`);
} else if (command === "list") {
	const rows = await db
		.select()
		.from(apiTokens)
		.orderBy(desc(apiTokens.createdAt));
	for (const row of rows)
		console.log(
			[
				row.id,
				row.name,
				row.scope,
				`created ${row.createdAt.toISOString()}`,
				row.lastUsedAt ? `used ${row.lastUsedAt.toISOString()}` : "never used",
				row.revokedAt ? `REVOKED ${row.revokedAt.toISOString()}` : "",
			]
				.filter(Boolean)
				.join("  "),
		);
	if (!rows.length) console.log("no tokens");
} else if (command === "revoke" && arg) {
	const [row] = await db
		.update(apiTokens)
		.set({ revokedAt: new Date() })
		.where(eq(apiTokens.id, arg))
		.returning();
	console.log(row ? `revoked ${row.id} (${row.name})` : `no token ${arg}`);
} else usage();

await sql.end();
