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
) => {
	const event: ChangeEvent = { collection, action, at: Date.now() };
	for (const subscriber of subscribers) {
		try {
			subscriber(event);
		} catch {
			// A dead stream must never break the write that triggered it.
		}
	}
};

export const subscriberCount = () => subscribers.size;
