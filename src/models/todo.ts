export interface ITodo {
	label: string;
	checked: boolean;
}

export interface Todo extends ITodo {
	id: string;
}
