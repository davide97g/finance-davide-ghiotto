/**
 * Session handling against the finance API.
 *
 * Google sign-in is gone: the app is used by two people, so the backend owns
 * email + password accounts and the session is an httpOnly cookie. Accounts are
 * created server-side with `bun run user:create`; there is no signup flow.
 */
import type { AppUser } from "../models/user";
import { setIsLoading } from "../services/utils";
import { useUserStore } from "../stores/user";
import { api } from "./http";
import { closeRealtime } from "./realtime";

export const checkUserIsLoggedIn = async (): Promise<AppUser> => {
	setIsLoading(true);
	try {
		const user = await api.get<AppUser>("/auth/me");
		useUserStore.getState().setUser(user);
		return user;
	} catch (error) {
		useUserStore.getState().setUser(null);
		throw error;
	} finally {
		setIsLoading(false);
	}
};

export const Auth = {
	async signInWithPassword(email: string, password: string): Promise<AppUser> {
		const user = await api.post<AppUser>("/auth/login", { email, password });
		useUserStore.getState().setUser(user);
		return user;
	},

	async signOut(): Promise<void> {
		try {
			await api.post("/auth/logout");
		} finally {
			// The change feed is authenticated; drop it with the session.
			closeRealtime();
			useUserStore.getState().setUser(null);
			window.location.href = "/";
		}
	},
};
