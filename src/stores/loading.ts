import { create } from 'zustand';

interface LoadingState {
	isLoading: boolean;
	setIsLoading: (loading: boolean) => void;
}

export const useLoadingStore = create<LoadingState>(set => ({
	isLoading: true,
	setIsLoading: (loading: boolean) => set({ isLoading: loading }),
}));

export const setIsLoading = (loading: boolean) => useLoadingStore.getState().setIsLoading(loading);
