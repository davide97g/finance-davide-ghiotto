export interface ITag {
	name: string;
	shortName: string;
	color?: string;
	description?: string;
}

export interface Tag extends ITag {
	id: string;
}
