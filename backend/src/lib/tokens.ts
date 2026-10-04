/**
 * API tokens for other services (autocratico reads transactions and records
 * paid bills). A token is `fin_` + 40 random characters, shown once when it is
 * created; the database keeps only its SHA-256, so a dump cannot be replayed.
 */
import { and, eq, isNull } from "drizzle-orm";
import { db } from "../db/client";
import { apiTokens } from "../db/schema";
import { newId } from "./id";

export type TokenScope = "read" | "write";

export const TOKEN_PREFIX = "fin_";

export const hashToken = (token: string) =>
	new Bun.CryptoHasher("sha256").update(token).digest("hex");

export const createToken = async (name: string, scope: TokenScope) => {
	const token = `${TOKEN_PREFIX}${newId(40)}`;
	const id = newId();
	await db
		.insert(apiTokens)
		.values({ id, name, scope, tokenHash: hashToken(token) });
	return { id, token };
};

/** `last_used_at` is written at most once a minute per token. */
const touched = new Map<string, number>();
const TOUCH_MS = 60_000;

export const findToken = async (token: string) => {
	const [row] = await db
		.select()
		.from(apiTokens)
		.where(
			and(
				eq(apiTokens.tokenHash, hashToken(token)),
				isNull(apiTokens.revokedAt),
			),
		)
		.limit(1);
	if (!row) return null;
	const now = Date.now();
	if (now - (touched.get(row.id) ?? 0) > TOUCH_MS) {
		touched.set(row.id, now);
		await db
			.update(apiTokens)
			.set({ lastUsedAt: new Date(now) })
			.where(eq(apiTokens.id, row.id));
	}
	return row;
};

const READ_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);
/** The only routes a `write` token may change: autocratico records expenses, nothing else. */
const WRITABLE = /^\/api\/transactions(\/|$)/;

export const tokenAllows = (scope: TokenScope, method: string, path: string) =>
	READ_METHODS.has(method) || (scope === "write" && WRITABLE.test(path));
