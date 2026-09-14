/**
 * Change feed, replacing Firestore's `onSnapshot`.
 *
 * The server announces which collection changed over SSE; subscribers re-read
 * that collection. One EventSource is shared by every subscriber, opened on
 * the first subscription and closed with the last one. `EventSource` reconnects
 * by itself, so a dropped connection needs no handling beyond re-reading on
 * the next event.
 */
import { BASE_URL } from "./http";

export type Collection =
	| "transactions"
	| "categories"
	| "tags"
	| "recurring"
	| "stats"
	| "groceries"
	| "todo"
	| "settings";

/** Firestore's `Unsubscribe`, kept so `getRT` callers are untouched. */
export type Unsubscribe = () => void;

type Listener = () => void;

const listeners = new Map<Collection, Set<Listener>>();
let source: EventSource | null = null;

const openSource = () => {
	if (source) return;
	source = new EventSource(`${BASE_URL}/events`, { withCredentials: true });
	source.addEventListener("change", (event) => {
		try {
			const { collection } = JSON.parse((event as MessageEvent).data) as {
				collection: Collection;
			};
			for (const listener of listeners.get(collection) ?? []) listener();
		} catch {
			// A malformed frame is not worth tearing the stream down for.
		}
	});
};

const closeSourceIfIdle = () => {
	if (!source) return;
	for (const set of listeners.values()) if (set.size) return;
	source.close();
	source = null;
};

export const onCollectionChange = (
	collection: Collection,
	listener: Listener,
): Unsubscribe => {
	const set = listeners.get(collection) ?? new Set<Listener>();
	set.add(listener);
	listeners.set(collection, set);
	openSource();

	return () => {
		set.delete(listener);
		closeSourceIfIdle();
	};
};

/** Drops the stream on logout so the next login opens an authenticated one. */
export const closeRealtime = () => {
	listeners.clear();
	source?.close();
	source = null;
};
