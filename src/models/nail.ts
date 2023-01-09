export type NailType = 'gel' | 'semipermanente' | 'smalto';

export interface INail {
	datetime: string;
	month: number;
	year: number;
	amount: number;
	category: NailType;
	clientId: string;
	note?: string;
}

export interface Nail extends INail {
	id: string;
}
