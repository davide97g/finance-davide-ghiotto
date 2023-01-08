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
		addCategory(category: Category) {
			this.categories.push(category);
		},
		removeCategory(category: Category) {
			this.categories.splice(
				this.categories.findIndex(c => c.id === category.id),
				1
			);
		},
	},
});
