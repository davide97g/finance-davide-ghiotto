export type CategoryType = 'expense' | 'earning';
export interface ICategory {
	name: string;
	type: CategoryType;
	color?: string;
	description?: string;
}

export interface Category extends ICategory {
	id: string;
}
