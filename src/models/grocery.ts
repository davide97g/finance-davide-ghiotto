export interface IGrocery {
	label: string;
	checked: boolean;
	category?: string;
}

export interface Grocery extends IGrocery {
	id: string;
}
