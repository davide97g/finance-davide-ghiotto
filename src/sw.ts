import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";

declare let self: ServiceWorkerGlobalScope;

// Drop precaches left behind by previous versions
cleanupOutdatedCaches();

// self.__WB_MANIFEST is default injection point
precacheAndRoute(self.__WB_MANIFEST);

// Auto-update: activate a newly installed worker right away and take control of
// open pages. The client (registerType: "autoUpdate") reloads on "activated",
// so a new deploy is picked up without prompting the user.
// biome-ignore lint/suspicious/noExplicitAny: Service worker global scope requires type assertions
(self as any).addEventListener("install", () => (self as any).skipWaiting());

// biome-ignore lint/suspicious/noExplicitAny: Service worker global scope requires type assertions
(self as any).addEventListener("activate", (event: any) => {
	// biome-ignore lint/suspicious/noExplicitAny: Service worker global scope requires type assertions
	event.waitUntil((self as any).clients.claim());
});
