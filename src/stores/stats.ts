import { defineStore } from 'pinia';
import { Stats } from '../models/stats';

export const useStatsStore = defineStore('stats', {
	state: () => {
		return {
			stats: [] as Stats[],
		};
	},
	actions: {
		setStats(stats: Stats[]) {
			const newStats = stats.filter(e => !this.stats.find(t => t.id === e.id));
			newStats.forEach(t => this.addStats(t));

			const presentStats = stats.filter(e => this.stats.find(t => t.id === e.id));
			presentStats.forEach(t => this.updateStats(t));
		},
		addStats(stats: Stats) {
			this.stats.push(stats);
		},
		removeStats(stats: Stats) {
			this.stats.splice(
				this.stats.findIndex(t => t.id === stats.id),
				1
			);
		},
		updateStats(stats: Stats) {
			const i = this.stats.findIndex(t => t.id === stats.id);
			this.stats[i] = stats;
		},
	},
});
