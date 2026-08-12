import { create } from "zustand";

/**
 * Offline/sync state.
 *
 * Firestore applies every write to its local IndexedDB cache immediately and
 * flushes it to the server when the connection is back, so writes never block
 * the UI. This store tracks what is still waiting for a server ack so the app
 * can show it:
 *
 * - `inFlight`: writes issued in this session whose ack has not arrived yet.
 * - `pendingByListener`: docs a real-time listener reports as `hasPendingWrites`.
 *   Needed because `inFlight` is lost on reload while the Firestore queue is not.
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
 * Counts a write while it flies to the server. The returned promise is never
 * awaited by callers: Firestore has already applied the change locally, so the
 * UI can move on and the ack only matters for the sync indicator.
 */
export const trackWrite = <T>(promise: Promise<T>, label: string): void => {
	useSyncStore.getState().writeStarted();
	promise
		.catch((err) => console.error(`${label} failed to sync`, err))
		.finally(() => useSyncStore.getState().writeSettled());
};
