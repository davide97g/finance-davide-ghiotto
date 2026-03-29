import { precacheAndRoute } from "workbox-precaching";

declare let self: ServiceWorkerGlobalScope;
// biome-ignore lint/suspicious/noExplicitAny: Service worker global scope requires type assertions
(self as any).addEventListener("message", (event: any) => {
	if (event.data && event.data.type === "SKIP_WAITING")
		// biome-ignore lint/suspicious/noExplicitAny: Service worker global scope requires type assertions
		(self as any).skipWaiting();
});
// self.__WB_MANIFEST is default injection point
precacheAndRoute(self.__WB_MANIFEST);
