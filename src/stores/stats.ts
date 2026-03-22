import { create } from 'zustand';
import { Stats } from '../models/stats';

interface StatsState {
	stats: Stats[];
	reset: () => void;
	setStats: (stats: Stats[]) => void;
	addStats: (stats: Stats) => void;
	removeStats: (stats: Stats) => void;
	updateStats: (stats: Stats) => void;
}

export const useStatsStore = create<StatsState>(set => ({
	stats: [],
	reset: () => set({ stats: [] }),
	setStats: (stats: Stats[]) => {
		set(state => {
			const newStats = stats.filter(e => !state.stats.find(t => t.id === e.id));
			const presentStats = stats.filter(e => state.stats.find(t => t.id === e.id));
			let updated = [...state.stats];
			presentStats.forEach(s => {
				updated = updated.map(existing => (existing.id === s.id ? s : existing));
			});
			return { stats: [...updated, ...newStats] };
		});
	},
	addStats: (stats: Stats) => {
		set(state => ({ stats: [...state.stats, stats] }));
	},
	removeStats: (stats: Stats) => {
		set(state => ({ stats: state.stats.filter(t => t.id !== stats.id) }));
	},
	updateStats: (stats: Stats) => {
		set(state => ({
			stats: state.stats.map(t => (t.id === stats.id ? stats : t)),
		}));
	},
}));
