import { User } from 'firebase/auth';
import { defineStore } from 'pinia';

const ADMINS = ['70DafDh0t0VJ6kwfES1WPYd9s723', 'RnGor26IYQM6vwRwq12vH1gKC1m1'];

export const useUserStore = defineStore('user', {
	state: () => {
		return {
			isLoggedIn: undefined as boolean | undefined,
			user: null as User | null,
			isAdmin: false as boolean,
		};
	},
	actions: {
		setUser(user: User | null) {
			this.user = user;
			this.isLoggedIn = !!this.user;
			this.isAdmin = this.isLoggedIn && ADMINS.includes(this.user!.uid);
		},
	},
});
