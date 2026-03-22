import { create } from 'zustand';
import { Category } from '../models/category';

interface CategoryState {
	categories: Category[];
	setCategories: (categories: Category[]) => void;
	addCategory: (category: Category) => void;
	updateCategory: (category: Category) => void;
	removeCategory: (category: Category) => void;
}

export const useCategoryStore = create<CategoryState>((set, get) => ({
	categories: [],
	setCategories: (categories: Category[]) => {
		set(state => {
			const newCategories = categories.filter(
				e => !state.categories.find(t => t.id === e.id)
			);
			const presentCategories = categories.filter(e =>
				state.categories.find(c => c.id === e.id)
			);
			let updated = [...state.categories];
			presentCategories.forEach(c => {
				updated = updated.map(existing => (existing.id === c.id ? c : existing));
			});
			return { categories: [...updated, ...newCategories] };
		});
	},
	addCategory: (category: Category) => {
		set(state => ({ categories: [...state.categories, category] }));
	},
	updateCategory: (category: Category) => {
		set(state => ({
			categories: state.categories.map(c => (c.id === category.id ? category : c)),
		}));
	},
	removeCategory: (category: Category) => {
		set(state => ({
			categories: state.categories.filter(c => c.id !== category.id),
		}));
	},
}));
