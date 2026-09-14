import { create } from "zustand";

/**
 * Online/sync state.
 *
 * Writes now travel straight to the API, so "pending" means "still in flight",
 * not "queued in a local cache":
 *
 * - `inFlight`: writes issued in this session whose response has not arrived.
 * - `pendingByListener`: kept for the offline write queue planned next; no
 *   listener reports into it yet.
 */
interface SyncState {
	isOnline: boolean;
	inFlight: number;
	pendingByListener: Record<string, number>;
	setIsOnline: (isOnline: boolean) => void;
	writeStarted: () => void;
	writeSettled: () => void;
	setPendingDocs: (listenerId: string, count: number) => void;
	clearListener: (listenerId: string) => void;
}

export const useSyncStore = create<SyncState>((set) => ({
	isOnline: typeof navigator === "undefined" ? true : navigator.onLine,
	inFlight: 0,
	pendingByListener: {},
	setIsOnline: (isOnline: boolean) => set({ isOnline }),
	writeStarted: () => set((state) => ({ inFlight: state.inFlight + 1 })),
	writeSettled: () =>
		set((state) => ({ inFlight: Math.max(0, state.inFlight - 1) })),
	setPendingDocs: (listenerId: string, count: number) =>
		set((state) => {
			if (state.pendingByListener[listenerId] === count) return state;
			return {
				pendingByListener: { ...state.pendingByListener, [listenerId]: count },
			};
		}),
	clearListener: (listenerId: string) =>
		set((state) => {
			if (!(listenerId in state.pendingByListener)) return state;
			const { [listenerId]: _removed, ...rest } = state.pendingByListener;
			return { pendingByListener: rest };
		}),
}));

/** Writes waiting for the server: session writes plus anything a listener still flags. */
export const selectPendingCount = (state: SyncState) =>
	Math.max(
		state.inFlight,
		Object.values(state.pendingByListener).reduce((tot, n) => tot + n, 0),
	);

if (typeof window !== "undefined") {
	window.addEventListener("online", () =>
		useSyncStore.getState().setIsOnline(true),
	);
	window.addEventListener("offline", () =>
		useSyncStore.getState().setIsOnline(false),
	);
}

let listenerCounter = 0;
export const nextListenerId = () => `l${++listenerCounter}`;

/**
 * Counts a write while it flies to the server and hands the promise back, so
 * callers can await the stored row (the id is now assigned by Postgres) while
 * the sync indicator stays honest. Failures are logged and rethrown: without a
 * local cache behind it, a failed write is a failed write.
 */
export const trackWrite = <T>(
	promise: Promise<T>,
	label: string,
): Promise<T> => {
	useSyncStore.getState().writeStarted();
	return promise
		.catch((err) => {
			console.error(`${label} failed`, err);
			throw err;
		})
		.finally(() => useSyncStore.getState().writeSettled());
};
