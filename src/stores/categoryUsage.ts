import { create } from 'zustand';

interface CategoryUsageState {
	counts: Record<string, number>;
	lastRefreshed: string | null;
	setCategoryUsage: (counts: Record<string, number>, lastRefreshed: string) => void;
}

export const useCategoryUsageStore = create<CategoryUsageState>(() => ({
	counts: {},
	lastRefreshed: null,
	setCategoryUsage: (counts, lastRefreshed) => {
		useCategoryUsageStore.setState({ counts, lastRefreshed });
	},
}));
