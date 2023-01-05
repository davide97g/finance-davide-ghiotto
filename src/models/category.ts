export interface ICategory {
	name: string;
	type: 'expense' | 'earning';
	color?: string;
	description?: string;
}

export interface Category extends ICategory {
	id: string;
}
