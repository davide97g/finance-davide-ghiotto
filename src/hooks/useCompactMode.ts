import { useCallback, useSyncExternalStore } from "react";

const STORAGE_KEY = "compact-mode";

function getStored(): boolean {
	return localStorage.getItem(STORAGE_KEY) === "true";
}

let listeners: Array<() => void> = [];
let current: boolean = getStored();

function subscribe(listener: () => void) {
	listeners = [...listeners, listener];
	return () => {
		listeners = listeners.filter((l) => l !== listener);
	};
}

function getSnapshot(): boolean {
	return current;
}

function setCompactMode(value: boolean) {
	current = value;
	localStorage.setItem(STORAGE_KEY, String(value));
	for (const listener of listeners) listener();
}

export function useCompactMode() {
	const compactMode = useSyncExternalStore(subscribe, getSnapshot);

	return {
		compactMode,
		setCompactMode: useCallback((v: boolean) => setCompactMode(v), []),
	};
}
