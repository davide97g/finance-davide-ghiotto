/**
 * Thin fetch wrapper around the finance API.
 *
 * The session lives in an httpOnly cookie, so every call is credentialed and
 * there is no token to juggle client-side. In production nginx serves the app
 * and proxies `/api` to the backend, which keeps the cookie first-party; in
 * dev, Vite proxies the same path.
 */
const BASE_URL = import.meta.env.VITE_API_URL || "/api";

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

const request = async <T>(
	method: string,
	path: string,
	body?: unknown,
): Promise<T> => {
	const response = await fetch(`${BASE_URL}${path}`, {
		method,
		credentials: "include",
		headers:
			body === undefined ? undefined : { "Content-Type": "application/json" },
		body: body === undefined ? undefined : JSON.stringify(body),
	});

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
	post: <T>(path: string, body?: unknown) => request<T>("POST", path, body),
	put: <T>(path: string, body?: unknown) => request<T>("PUT", path, body),
	delete: <T>(path: string) => request<T>("DELETE", path),
};

export { BASE_URL };
