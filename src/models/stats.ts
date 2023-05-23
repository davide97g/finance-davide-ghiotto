export interface IStats {
	month: string;
	year: string;
	total: number;
	type: 'expense' | 'earning';
}

export interface Stats extends IStats {
	id: string;
}
