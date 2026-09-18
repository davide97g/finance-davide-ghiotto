import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Unsubscribe } from "../api/db";

/**
 * Optimistic checklist state.
 *
 * Ticking something off in a shop has to land the moment the finger lifts, and
 * the connection in a shop is exactly where it won't. So the tap paints
 * straight away and the write follows behind it:
 *
 * - The server list and the local intent are kept apart. Render merges them,
 *   so an intent is never lost to a refetch that happens to be in flight.
 * - An intent is dropped only when the server agrees with it or the write
 *   fails. Resolving on "the promise settled" alone would leave a window where
 *   a read issued *before* the write committed can land after it and flip the
 *   row back.
 * - Writes to one row are chained, so a double tap can't commit out of order.
 * - A failed write rolls its row back and surfaces a message; with no offline
 *   queue behind it, a lost write must not look like a saved one.
 */
export interface ChecklistRecord {
	id: string;
	label: string;
	checked: boolean;
}

export interface ChecklistSource<T extends ChecklistRecord> {
	getRT(callback: (items: T[]) => void): Promise<Unsubscribe>;
	create(item: { label: string; checked: boolean }): Promise<T>;
	setChecked(id: string, checked: boolean): Promise<T>;
	delete(id: string): Promise<boolean>;
}

export interface ChecklistItemView extends ChecklistRecord {
	/** Exists only locally: added here, not yet stored. A tick in flight is not
	 * flagged — it is painted as done, which is the whole point. */
	unsaved: boolean;
}

interface State<T extends ChecklistRecord> {
	server: T[];
	/** Locally intended `checked` per id, until the server matches it. */
	overrides: Record<string, boolean>;
	/** Added locally, still without a server id. */
	creating: T[];
	/** Deleted locally, still present in `server`. */
	removed: Record<string, true>;
}

const upsert = <T extends ChecklistRecord>(rows: T[], row: T): T[] => {
	const index = rows.findIndex((r) => r.id === row.id);
	if (index === -1) return [...rows, row];
	const next = rows.slice();
	next[index] = row;
	return next;
};

const without = (map: Record<string, boolean>, id: string) => {
	if (!(id in map)) return map;
	const { [id]: _dropped, ...rest } = map;
	return rest;
};

const tempId = () => `tmp-${Math.random().toString(36).slice(2)}`;

export function useChecklist<T extends ChecklistRecord>(
	source: ChecklistSource<T>,
) {
	const [state, setState] = useState<State<T>>({
		server: [],
		overrides: {},
		creating: [],
		removed: {},
	});
	const [error, setError] = useState<string | null>(null);

	const alive = useRef(true);
	/** One promise chain per id, so writes to a row stay in order. */
	const chains = useRef(new Map<string, Promise<unknown>>());
	const sourceRef = useRef(source);
	sourceRef.current = source;

	const patch = useCallback((update: (prev: State<T>) => State<T>) => {
		if (!alive.current) return;
		setState(update);
	}, []);

	useEffect(() => {
		alive.current = true;
		let unsubscribe: Unsubscribe | undefined;

		sourceRef.current
			.getRT((items: T[]) => {
				patch((prev) => {
					const present = new Set(items.map((i) => i.id));
					// An intent survives until the server states the same thing.
					const overrides: Record<string, boolean> = {};
					for (const [id, checked] of Object.entries(prev.overrides)) {
						const row = items.find((i) => i.id === id);
						// Gone, or already saying what we wanted: nothing left to hold.
						if (!row || row.checked === checked) continue;
						overrides[id] = checked;
					}
					const removed: Record<string, true> = {};
					for (const id of Object.keys(prev.removed)) {
						if (present.has(id)) removed[id] = true;
					}
					return { ...prev, server: items, overrides, removed };
				});
			})
			.then((unsub) => {
				if (alive.current) unsubscribe = unsub;
				else unsub();
			})
			.catch((err) => console.error("checklist subscription failed", err));

		return () => {
			alive.current = false;
			unsubscribe?.();
		};
	}, [patch]);

	const items = useMemo<ChecklistItemView[]>(() => {
		const { server, overrides, creating, removed } = state;
		const merged: ChecklistItemView[] = [];
		for (const item of server) {
			if (removed[item.id]) continue;
			const override = overrides[item.id];
			merged.push(
				override === undefined
					? { ...item, unsaved: false }
					: { ...item, checked: override, unsaved: false },
			);
		}
		for (const item of creating) merged.push({ ...item, unsaved: true });
		return merged;
	}, [state]);

	/**
	 * Queues `run` behind whatever is already in flight for this id, so two fast
	 * taps on one row can't reach the server out of order. Every step swallows
	 * its own failure: the chain has to keep moving for the taps behind it.
	 */
	const enqueue = useCallback((id: string, run: () => Promise<unknown>) => {
		const previous = chains.current.get(id) ?? Promise.resolve();
		const next = previous.then(run, run).catch(() => undefined);
		chains.current.set(id, next);
		void next.then(() => {
			if (chains.current.get(id) === next) chains.current.delete(id);
		});
	}, []);

	const toggle = useCallback(
		(item: ChecklistItemView) => {
			const checked = !item.checked;
			setError(null);
			patch((prev) => ({
				...prev,
				overrides: { ...prev.overrides, [item.id]: checked },
			}));

			enqueue(item.id, () =>
				sourceRef.current
					.setChecked(item.id, checked)
					.then((row) => {
						// The write's own answer is authoritative, so the row lands here
						// rather than waiting on a re-read of the whole collection.
						patch((prev) => ({
							...prev,
							server: upsert(prev.server, row),
							overrides:
								prev.overrides[item.id] === row.checked
									? without(prev.overrides, item.id)
									: prev.overrides,
						}));
					})
					.catch(() => {
						patch((prev) => ({
							...prev,
							overrides: without(prev.overrides, item.id),
						}));
						if (alive.current) setError("Couldn't save that — try again.");
					}),
			);
		},
		[enqueue, patch],
	);

	const add = useCallback(
		(label: string) => {
			const optimistic = { id: tempId(), label, checked: false } as T;
			setError(null);
			patch((prev) => ({ ...prev, creating: [...prev.creating, optimistic] }));

			const drop = (prev: State<T>) => ({
				...prev,
				creating: prev.creating.filter((i) => i.id !== optimistic.id),
			});

			return sourceRef.current
				.create({ label, checked: false })
				.then((row) => {
					patch((prev) => ({
						...drop(prev),
						server: upsert(prev.server, row),
					}));
					return row;
				})
				.catch((err) => {
					patch(drop);
					if (alive.current) setError(`Couldn't add "${label}" — try again.`);
					throw err;
				});
		},
		[patch],
	);

	const remove = useCallback(
		(item: ChecklistItemView) => {
			setError(null);
			// Never been to the server, so there is nothing to delete there.
			if (item.id.startsWith("tmp-")) {
				patch((prev) => ({
					...prev,
					creating: prev.creating.filter((i) => i.id !== item.id),
				}));
				return;
			}

			patch((prev) => ({
				...prev,
				removed: { ...prev.removed, [item.id]: true },
			}));

			enqueue(item.id, () =>
				sourceRef.current.delete(item.id).catch(() => {
					patch((prev) => {
						const { [item.id]: _restored, ...removed } = prev.removed;
						return { ...prev, removed };
					});
					if (alive.current) setError("Couldn't delete that — try again.");
				}),
			);
		},
		[enqueue, patch],
	);

	const dismissError = useCallback(() => setError(null), []);

	return { items, error, dismissError, toggle, add, remove };
}
