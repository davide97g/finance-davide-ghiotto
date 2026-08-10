import { DataBaseClient } from "../api/db";
import type { Recurring } from "../models/recurring";
import type { ITransaction } from "../models/transaction";
import { MONTHS } from "./utils";

/** Max months generated per template in one run; guards against a malformed lastPeriod. */
const MAX_CATCH_UP = 24;

/** `YYYY-MM` of the given date. Zero-padded so periods compare as strings. */
export const toPeriod = (date: Date) =>
	`${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}`;

const nextPeriod = (period: string) => {
	const [year, month] = period.split("-").map(Number);
	return month === 12
		? `${year + 1}-01`
		: `${year}-${`${month + 1}`.padStart(2, "0")}`;
};

/** The transaction for this template in this period, or null when the day hasn't come yet. */
const occurrence = (
	recurring: Recurring,
	period: string,
	now: Date,
): ITransaction | null => {
	const [year, month] = period.split("-").map(Number);
	const daysInMonth = new Date(year, month, 0).getDate();
	const day = Math.min(recurring.dayOfMonth, daysInMonth);
	if (period === toPeriod(now) && day > now.getDate()) return null;
	return {
		date: `${period}-${`${day}`.padStart(2, "0")}`,
		month: MONTHS[month - 1],
		year: `${year}`,
		amount: recurring.amount,
		description: recurring.description,
		category: recurring.category,
		type: recurring.type,
		tag: recurring.tag,
		recurringId: recurring.id,
	};
};

/**
 * Creates the transactions due since each template's lastPeriod, up to the current month.
 * Missed months are backfilled; lastPeriod is the idempotency guard, so running it twice
 * generates nothing the second time.
 */
export async function syncRecurring(): Promise<number> {
	const recurrings = await DataBaseClient.Recurring.get();
	const now = new Date();
	const currentPeriod = toPeriod(now);
	let created = 0;

	for (const recurring of recurrings.filter((r) => r.active)) {
		const pending: ITransaction[] = [];
		let period = nextPeriod(recurring.lastPeriod);
		let lastGenerated = recurring.lastPeriod;

		while (period <= currentPeriod && pending.length < MAX_CATCH_UP) {
			const transaction = occurrence(recurring, period, now);
			if (!transaction) break;
			pending.push(transaction);
			lastGenerated = period;
			period = nextPeriod(period);
		}

		if (!pending.length) continue;
		await DataBaseClient.Transaction.bulkAdd(pending);
		await DataBaseClient.Recurring.update({
			...recurring,
			lastPeriod: lastGenerated,
		});
		created += pending.length;
	}

	return created;
}
