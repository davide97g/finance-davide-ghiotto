export type CategoryType = 'expense' | 'earning' | 'nail';
export interface ICategory {
	name: string;
	type: CategoryType;
	color?: string;
	description?: string;
	excludeFromBudget?: boolean;
}

export interface Category extends ICategory {
	id: string;
}
