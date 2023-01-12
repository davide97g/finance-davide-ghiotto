export type PeriodicityFrequency = 'daily' | 'weekly' | 'monthly' | 'yearly';

export interface Periodicity {
	startDate: string;
	endDate?: string;
	frequency: PeriodicityFrequency;
	repeats?: number;
}

export interface ITransaction {
	date: string;
	month: string;
	year: string;
	amount: number;
	description: string;
	category: string;
	type: 'expense' | 'earning';
	periodicity?: Periodicity;
}

export interface Transaction extends ITransaction {
	id: string;
}
