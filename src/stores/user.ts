import { create } from "zustand";
import type { AppUser } from "../models/user";

interface UserState {
	isLoggedIn: boolean | undefined;
	user: AppUser | null;
	isAdmin: boolean;
	setUser: (user: AppUser | null) => void;
}

export const useUserStore = create<UserState>((set) => ({
	isLoggedIn: undefined,
	user: null,
	isAdmin: false,
	// Admin is a column on the user row now, not a hardcoded uid list.
	setUser: (user: AppUser | null) =>
		set({
			user,
			isLoggedIn: !!user,
			isAdmin: !!user?.isAdmin,
		}),
}));
