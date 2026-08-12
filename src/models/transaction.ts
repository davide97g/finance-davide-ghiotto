export interface ITransaction {
	/** Unix ms when the row was created; used to order same-day items (newest first when sorting by date descending). */
	createdAt?: number;
	date: string;
	month: string;
	year: string;
	amount: number;
	description: string;
	category: string;
	type: "expense" | "earning";
	tag?: string;
	/** Set when the row was generated from a recurring template. */
	recurringId?: string;
}

export interface Transaction extends ITransaction {
	id: string;
	/** Client-side only: the row is still queued for the server (offline write). */
	pending?: boolean;
}
