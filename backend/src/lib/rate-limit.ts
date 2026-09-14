/**
 * Brute-force protection for the login route.
 *
 * Two independent limits, both in memory (one API container, one process):
 *
 *  - per account: a handful of wrong passwords locks that email for a while,
 *    which is what actually protects a weak password;
 *  - per IP: a ceiling on attempts from one source, so a single client cannot
 *    walk through a list of addresses to dodge the per-account lock.
 *
 * Counters are deliberately not persisted: a restart clearing them is an
 * acceptable trade for having no schema, and an attacker cannot trigger one.
 */
import type { Context } from "hono";

/** Wrong passwords for one email before it is locked. */
const ACCOUNT_MAX_FAILURES = 5;
/** How long an account stays locked once the limit is hit. */
const ACCOUNT_LOCK_MS = 15 * 60 * 1000;
/** Login attempts allowed from one IP inside the window, successes included. */
const IP_MAX_ATTEMPTS = 20;
const IP_WINDOW_MS = 15 * 60 * 1000;
/** Entries idle for longer than this are dropped by the sweeper. */
const IDLE_TTL_MS = 60 * 60 * 1000;

interface AccountState {
	failures: number;
	lockedUntil: number;
	lastSeen: number;
}

interface IpState {
	/** Attempt timestamps inside the current window. */
	attempts: number[];
	lastSeen: number;
}

const accounts = new Map<string, AccountState>();
const ips = new Map<string, IpState>();

/**
 * Best-effort client address. Cloudflare sets `CF-Connecting-IP`, and nginx
 * appends to `X-Forwarded-For`; neither is trustworthy for a request that
 * reaches the container directly from the LAN, which is why the per-account
 * lock, not this, is the real protection.
 */
export const clientIp = (c: Context): string => {
	const cloudflare = c.req.header("CF-Connecting-IP");
	if (cloudflare) return cloudflare.trim();
	const forwarded = c.req.header("X-Forwarded-For");
	if (forwarded) return forwarded.split(",")[0].trim();
	return "unknown";
};

const secondsUntil = (timestamp: number) =>
	Math.max(1, Math.ceil((timestamp - Date.now()) / 1000));

export interface LimitDecision {
	allowed: boolean;
	retryAfter: number;
	reason?: "account" | "ip";
}

const ALLOWED: LimitDecision = { allowed: true, retryAfter: 0 };

/** Called before the password is checked. */
export const checkLoginAllowed = (email: string, ip: string): LimitDecision => {
	const now = Date.now();

	const account = accounts.get(email);
	if (account && account.lockedUntil > now)
		return {
			allowed: false,
			retryAfter: secondsUntil(account.lockedUntil),
			reason: "account",
		};

	const perIp = ips.get(ip);
	if (perIp) {
		perIp.attempts = perIp.attempts.filter((at) => now - at < IP_WINDOW_MS);
		if (perIp.attempts.length >= IP_MAX_ATTEMPTS)
			return {
				allowed: false,
				retryAfter: secondsUntil(perIp.attempts[0] + IP_WINDOW_MS),
				reason: "ip",
			};
	}

	return ALLOWED;
};

/** Every attempt counts against the IP budget, successful or not. */
export const recordAttempt = (ip: string) => {
	const now = Date.now();
	const state = ips.get(ip) ?? { attempts: [], lastSeen: now };
	state.attempts = state.attempts.filter((at) => now - at < IP_WINDOW_MS);
	state.attempts.push(now);
	state.lastSeen = now;
	ips.set(ip, state);
};

/** Returns the lock duration in seconds when this failure triggered a lock. */
export const recordFailure = (email: string): number => {
	const now = Date.now();
	const state = accounts.get(email) ?? {
		failures: 0,
		lockedUntil: 0,
		lastSeen: now,
	};
	state.failures += 1;
	state.lastSeen = now;

	if (state.failures >= ACCOUNT_MAX_FAILURES) {
		state.lockedUntil = now + ACCOUNT_LOCK_MS;
		state.failures = 0;
		accounts.set(email, state);
		return Math.ceil(ACCOUNT_LOCK_MS / 1000);
	}

	accounts.set(email, state);
	return 0;
};

/** A correct password clears the account's failure streak. */
export const recordSuccess = (email: string) => {
	accounts.delete(email);
};

/** Attempts left before this email locks; for the log line only. */
export const remainingAttempts = (email: string) =>
	ACCOUNT_MAX_FAILURES - (accounts.get(email)?.failures ?? 0);

const sweep = () => {
	const now = Date.now();
	for (const [key, state] of accounts)
		if (now - state.lastSeen > IDLE_TTL_MS && state.lockedUntil < now)
			accounts.delete(key);
	for (const [key, state] of ips)
		if (now - state.lastSeen > IDLE_TTL_MS) ips.delete(key);
};

// Unref'd so the sweeper never holds the process open on shutdown.
setInterval(sweep, 10 * 60 * 1000).unref();

/** Test/ops hook: drop every counter. */
export const resetLimits = () => {
	accounts.clear();
	ips.clear();
};
