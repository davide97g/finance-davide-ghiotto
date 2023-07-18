export interface IStats {
	month: string;
	year: string;
	total: number;
	type: 'expense' | 'earning';
	lastUpdate: string;
	categorySummary: {
		categoryId: string;
		total: number;
	}[];
}

export interface Stats extends IStats {
	id: string;
}
