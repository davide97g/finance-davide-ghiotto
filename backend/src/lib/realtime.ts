/**
 * Change feed replacing Firestore's `onSnapshot`.
 *
 * The frontend's `getRT()` used to receive whole collections on every change.
 * Here the server only announces *which* collection changed and the client
 * re-fetches it — same contract for the UI, far less machinery than streaming
 * per-document diffs, and correct for a household-sized dataset.
 */
export type ChangedCollection =
	| "transactions"
	| "categories"
	| "tags"
	| "recurring"
	| "stats"
	| "groceries"
	| "todo"
	| "settings";

export interface ChangeEvent {
	collection: ChangedCollection;
	action: "create" | "update" | "delete";
	at: number;
	/**
	 * The `X-Client-Id` of the tab that made the write, when it sent one. The
	 * writer already has the server's answer in its own response, so it skips
	 * the re-read this event would otherwise trigger; every other tab still
	 * re-reads.
	 */
	origin?: string;
}

type Subscriber = (event: ChangeEvent) => void;

const subscribers = new Set<Subscriber>();

export const subscribe = (subscriber: Subscriber) => {
	subscribers.add(subscriber);
	return () => subscribers.delete(subscriber);
};

export const publish = (
	collection: ChangedCollection,
	action: ChangeEvent["action"],
	origin?: string,
) => {
	const event: ChangeEvent = { collection, action, at: Date.now(), origin };
	for (const subscriber of subscribers) {
		try {
			subscriber(event);
		} catch {
			// A dead stream must never break the write that triggered it.
		}
	}
};

export const subscriberCount = () => subscribers.size;
