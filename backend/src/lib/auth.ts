/**
 * Email + password auth for a two-person app.
 *
 * Passwords are hashed with Bun's built-in Argon2id, the session is a signed
 * JWT kept in an httpOnly cookie, and there is no signup route on purpose:
 * accounts are created with `bun run user:create`.
 */
import type { Context, MiddlewareHandler } from "hono";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { sign, verify } from "hono/jwt";
import {
	findToken,
	TOKEN_PREFIX,
	type TokenScope,
	tokenAllows,
} from "./tokens";

export const SESSION_COOKIE = "fin_session";
const THIRTY_DAYS_SECONDS = 60 * 60 * 24 * 30;

export interface SessionUser {
	uid: string;
	email: string;
	isAdmin: boolean;
	/** Set only for API tokens; people's sessions have no scope limit. */
	scope?: TokenScope;
}

const secret = () => {
	const value = process.env.SESSION_SECRET;
	if (!value) throw new Error("SESSION_SECRET is not set");
	return value;
};

export const hashPassword = (password: string) =>
	Bun.password.hash(password, { algorithm: "argon2id" });

export const verifyPassword = (password: string, hash: string) =>
	Bun.password.verify(password, hash);

export const issueSession = async (c: Context, user: SessionUser) => {
	const token = await sign(
		{
			...user,
			exp: Math.floor(Date.now() / 1000) + THIRTY_DAYS_SECONDS,
		},
		secret(),
	);
	setCookie(c, SESSION_COOKIE, token, {
		httpOnly: true,
		sameSite: "Lax",
		secure: process.env.SECURE_COOKIES === "true",
		path: "/",
		maxAge: THIRTY_DAYS_SECONDS,
	});
	return token;
};

export const clearSession = (c: Context) =>
	deleteCookie(c, SESSION_COOKIE, { path: "/" });

/**
 * Reads the session from the cookie, falling back to a bearer token: a session
 * JWT for CLI use, or an API token (`fin_…`) for other services.
 */
const readSession = async (c: Context): Promise<SessionUser | null> => {
	const bearer = c.req.header("Authorization")?.replace(/^Bearer\s+/i, "");
	if (bearer?.startsWith(TOKEN_PREFIX)) {
		const row = await findToken(bearer);
		return row
			? { uid: `token:${row.id}`, email: "", isAdmin: false, scope: row.scope }
			: null;
	}
	const token = getCookie(c, SESSION_COOKIE) ?? bearer;
	if (!token) return null;
	try {
		const payload = (await verify(
			token,
			secret(),
			"HS256",
		)) as unknown as SessionUser;
		return payload;
	} catch {
		return null;
	}
};

/** Rejects anonymous requests; every data route sits behind it. */
export const requireAuth: MiddlewareHandler<{
	Variables: { user: SessionUser };
}> = async (c, next) => {
	const user = await readSession(c);
	if (!user) return c.json({ error: "unauthorized" }, 401);
	if (user.scope && !tokenAllows(user.scope, c.req.method, c.req.path))
		return c.json({ error: "forbidden for this token" }, 403);
	c.set("user", user);
	await next();
};

export const currentUser = readSession;
