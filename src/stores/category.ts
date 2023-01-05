import { defineStore } from 'pinia';
import { Category } from '../models/category';

export const useCategoryStore = defineStore('category', {
	state: () => {
		return {
			categories: [] as Category[],
		};
	},
	actions: {
		setCategories(categories: Category[]) {
			this.categories = categories;
		},
	},
});
