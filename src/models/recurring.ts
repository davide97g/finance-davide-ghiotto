export interface IRecurring {
	/** Unix ms when the template was created. */
	createdAt?: number;
	description: string;
	amount: number;
	category: string;
	type: "expense" | "earning";
	tag?: string;
	/** Day of the month the transaction is generated on; clamped to the month length. */
	dayOfMonth: number;
	/** Paused templates generate nothing. */
	active: boolean;
	/** Last generated period as `YYYY-MM`; generation resumes from the month after. */
	lastPeriod: string;
}

export interface Recurring extends IRecurring {
	id: string;
}
