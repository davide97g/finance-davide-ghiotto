export type NailType = 'gel' | 'semipermanente' | 'smalto';

export interface INail {
	datetime: string;
	month: string;
	year: string;
	amount: number;
	category: NailType;
	clientId: string;
	note?: string;
}

export interface Nail extends INail {
	id: string;
}

export interface IClient {
	name: string;
	phone: string;
	email: string;
	nailsId: string[]; // history of nails linked by ids of the collection "nails"
}
