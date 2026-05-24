import type { User } from "firebase/auth";
import { create } from "zustand";

const ADMINS = ["70DafDh0t0VJ6kwfES1WPYd9s723", "RnGor26IYQM6vwRwq12vH1gKC1m1"];

interface UserState {
	isLoggedIn: boolean | undefined;
	user: User | null;
	isAdmin: boolean;
	setUser: (user: User | null) => void;
}

export const useUserStore = create<UserState>((set) => ({
	isLoggedIn: undefined,
	user: null,
	isAdmin: false,
	setUser: (user: User | null) =>
		set({
			user,
			isLoggedIn: !!user,
			isAdmin: !!user && ADMINS.includes(user.uid),
		}),
}));
