export interface ICategory {
	name: string;
	type: 'expense' | 'earning';
	color?: string;
	description?: string;
}
