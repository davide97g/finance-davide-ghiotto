import { useCallback, useEffect, useSyncExternalStore } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "theme";

function getStoredTheme(): Theme {
	const stored = localStorage.getItem(STORAGE_KEY);
	if (stored === "light" || stored === "dark") return stored;
	return "light";
}

function applyTheme(theme: Theme) {
	document.documentElement.classList.toggle("dark", theme === "dark");
}

// External store for theme preference
let listeners: Array<() => void> = [];
let currentTheme: Theme = getStoredTheme();

function subscribe(listener: () => void) {
	listeners = [...listeners, listener];
	return () => {
		listeners = listeners.filter((l) => l !== listener);
	};
}

function getSnapshot(): Theme {
	return currentTheme;
}

function setTheme(theme: Theme) {
	currentTheme = theme;
	localStorage.setItem(STORAGE_KEY, theme);
	applyTheme(theme);
	for (const listener of listeners) listener();
}

// Apply on load
applyTheme(currentTheme);

export function useTheme() {
	const theme = useSyncExternalStore(subscribe, getSnapshot);

	// Keep DOM in sync when this hook mounts
	useEffect(() => {
		applyTheme(theme);
	}, [theme]);

	return {
		theme,
		setTheme: useCallback((t: Theme) => setTheme(t), []),
	};
}
