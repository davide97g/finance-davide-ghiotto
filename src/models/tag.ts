export interface ITag {
	name: string;
	color?: string;
	description?: string;
}

export interface Tag extends ITag {
	id: string;
}
