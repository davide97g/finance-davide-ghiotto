/**
 * Thin fetch wrapper around the finance API.
 *
 * The session lives in an httpOnly cookie, so every call is credentialed and
 * there is no token to juggle client-side. In production nginx serves the app
 * and proxies `/api` to the backend, which keeps the cookie first-party; in
 * dev, Vite proxies the same path.
 */
const BASE_URL = import.meta.env.VITE_API_URL || "/api";

/**
 * Identifies this tab for the lifetime of the page. It rides along on writes so
 * the server can stamp the resulting change event with its origin, letting this
 * tab skip the re-read it would otherwise do for its own write — the write's
 * own response already carries the new row. Other tabs and devices still
 * re-read as before.
 */
export const CLIENT_ID =
	typeof crypto !== "undefined" && "randomUUID" in crypto
		? crypto.randomUUID()
		: `c${Date.now()}${Math.random().toString(36).slice(2)}`;

export class ApiError extends Error {
	constructor(
		readonly status: number,
		message: string,
		/** Parsed error payload when the server sent JSON, e.g. `{ retryAfter }`. */
		readonly body?: Record<string, unknown>,
	) {
		super(message);
		this.name = "ApiError";
	}
}

interface RequestOptions {
	/**
	 * Lets a small write outlive the page: the browser finishes it even if the
	 * tab is backgrounded or closed mid-flight. Exactly the case of locking the
	 * phone right after ticking something off a list in a shop.
	 */
	keepalive?: boolean;
	/** `high` jumps the browser's queue ahead of background refetches. */
	priority?: "high" | "low" | "auto";
}

const request = async <T>(
	method: string,
	path: string,
	body?: unknown,
	options?: RequestOptions,
): Promise<T> => {
	const headers: Record<string, string> = { "X-Client-Id": CLIENT_ID };
	if (body !== undefined) headers["Content-Type"] = "application/json";

	const response = await fetch(`${BASE_URL}${path}`, {
		method,
		credentials: "include",
		headers,
		body: body === undefined ? undefined : JSON.stringify(body),
		keepalive: options?.keepalive,
		// Not in every lib.dom yet; harmless where the browser ignores it.
		...(options?.priority ? { priority: options.priority } : {}),
	} as RequestInit);

	if (!response.ok) {
		const detail = await response.text().catch(() => "");
		let body: Record<string, unknown> | undefined;
		try {
			body = JSON.parse(detail);
		} catch {
			// Not every error body is JSON; the text still goes in the message.
		}
		throw new ApiError(
			response.status,
			detail || `${method} ${path} failed with ${response.status}`,
			body,
		);
	}

	if (response.status === 204) return undefined as T;
	return (await response.json()) as T;
};

/** Drops empty filters so `?month=&year=` never reaches the API. */
export const toQuery = (params: Record<string, string | undefined>) => {
	const entries = Object.entries(params).filter(([, value]) => !!value) as [
		string,
		string,
	][];
	return entries.length ? `?${new URLSearchParams(entries)}` : "";
};

export const api = {
	get: <T>(path: string) => request<T>("GET", path),
	post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
		request<T>("POST", path, body, options),
	put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
	patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
		request<T>("PATCH", path, body, options),
	delete: <T>(path: string, options?: RequestOptions) =>
		request<T>("DELETE", path, undefined, options),
};

export { BASE_URL };
