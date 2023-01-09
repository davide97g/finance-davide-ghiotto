import { defineStore } from 'pinia';
import { Nail } from '../models/nail';

export const useNailStore = defineStore('nail', {
	state: () => {
		return {
			nails: [] as Nail[],
		};
	},
	actions: {
		setNails(nails: Nail[]) {
			this.nails = nails;
			this.sortNails();
		},
		addNail(nail: Nail) {
			if (this.nails.find(t => t.id === nail.id)) return;
			else this.nails.push(nail);
			this.sortNails();
		},
		removeNail(nail: Nail) {
			this.nails = this.nails.filter(t => t.id !== nail.id);
			this.sortNails();
		},
		updateNail(nail: Nail) {
			const index = this.nails.findIndex(t => t.id === nail.id);
			if (index < 0) return;
			else this.nails[index] = nail;
			this.sortNails();
		},
		sortNails(ascending?: boolean) {
			this.nails.sort(
				(a, b) =>
					(new Date(a.datetime).getTime() - new Date(b.datetime).getTime() ? 1 : -1) *
					(ascending ? 1 : -1)
			);
		},
	},
});
