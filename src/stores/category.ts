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
			const newCategories = categories.filter(e => !this.categories.find(t => t.id === e.id));
			newCategories.forEach(c => this.addCategory(c));

			const presentCategories = categories.filter(e =>
				this.categories.find(c => c.id === e.id)
			);
			presentCategories.forEach(c => this.updateCategory(c));
		},
		addCategory(category: Category) {
			this.categories.push(category);
		},
		updateCategory(category: Category) {
			const i = this.categories.findIndex(c => c.id === category.id);
			this.categories[i] = category;
		},
		removeCategory(category: Category) {
			this.categories.splice(
				this.categories.findIndex(c => c.id === category.id),
				1
			);
		},
	},
});
