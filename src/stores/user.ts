import { User } from 'firebase/auth';
import { defineStore } from 'pinia';

export const useUserStore = defineStore('user', {
	state: () => {
		return {
			isLoggedIn: false as boolean,
			user: null as User | null,
		};
	},
	actions: {
		setUser(user: User | null) {
			this.user = user;
			this.isLoggedIn = !!this.user;
		},
	},
});
