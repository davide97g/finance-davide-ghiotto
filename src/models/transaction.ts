export interface ITransaction {
	date: string;
	amount: number;
	description: string;
	category: string;
	type: 'expense' | 'earning';
}

export interface Transaction extends ITransaction {
	id: string;
}
