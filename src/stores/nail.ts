import { defineStore } from 'pinia';
import { Category } from '../models/category';
import { Nail } from '../models/nail';

export const useNailStore = defineStore('nail', {
	state: () => {
		return {
			nails: [] as Nail[],
			categories: [] as Category[],
			sorting: 'descending' as 'descending' | 'ascending',
		};
	},
	actions: {
		setNails(nails: Nail[]) {
			const newNails = nails.filter(e => !this.nails.find(n => n.id === e.id));
			newNails.forEach(n => this.addNail(n));

			const presentNails = nails.filter(e => this.nails.find(n => n.id === e.id));
			presentNails.forEach(n => this.updateNail(n));
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
			this.sorting = ascending ? 'ascending' : 'descending';
			this.nails.sort(
				(a, b) =>
					(new Date(a.datetime).getTime() - new Date(b.datetime).getTime() ? 1 : -1) *
					(ascending ? 1 : -1)
			);
		},
	},
});
