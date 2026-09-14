/**
 * Row -> frontend model mappers.
 *
 * The React app is unchanged, so every payload must match the interfaces in
 * `src/models/*`: `amount` is a number (Postgres numeric arrives as a string),
 * ids are flattened back onto `category` / `tag`, and optional fields are
 * omitted rather than sent as null.
 */
import type { InferSelectModel } from "drizzle-orm";
import type {
	categories,
	groceries,
	recurring,
	stats,
	statsCategories,
	tags,
	todos,
	transactions,
	users,
} from "../db/schema";

const num = (value: string) => Number(value);
/** Drops null-valued keys so `JSON.stringify` output matches the old documents. */
const compact = <T extends Record<string, unknown>>(object: T) =>
	Object.fromEntries(
		Object.entries(object).filter(([, value]) => value !== null),
	) as T;

export const toTransaction = (row: InferSelectModel<typeof transactions>) =>
	compact({
		id: row.id,
		date: row.date,
		month: row.month,
		year: row.year,
		amount: num(row.amount),
		description: row.description,
		category: row.categoryId,
		type: row.type,
		tag: row.tagId,
		recurringId: row.recurringId,
		createdAt: row.createdAt,
	});

export const toCategory = (row: InferSelectModel<typeof categories>) =>
	compact({
		id: row.id,
		name: row.name,
		type: row.type,
		color: row.color,
		description: row.description,
		excludeFromBudget: row.excludeFromBudget,
	});

export const toTag = (row: InferSelectModel<typeof tags>) =>
	compact({
		id: row.id,
		name: row.name,
		color: row.color,
		description: row.description,
	});

export const toRecurring = (row: InferSelectModel<typeof recurring>) =>
	compact({
		id: row.id,
		description: row.description,
		amount: num(row.amount),
		category: row.categoryId,
		type: row.type,
		tag: row.tagId,
		dayOfMonth: row.dayOfMonth,
		active: row.active,
		lastPeriod: row.lastPeriod,
		createdAt: row.createdAt,
	});

export const toStats = (
	row: InferSelectModel<typeof stats>,
	summary: InferSelectModel<typeof statsCategories>[],
) => ({
	id: row.id,
	month: row.month,
	year: row.year,
	total: num(row.total),
	type: row.type,
	lastUpdate: row.lastUpdate,
	categorySummary: summary.map((entry) => ({
		categoryId: entry.categoryId,
		total: num(entry.total),
	})),
});

export const toGrocery = (row: InferSelectModel<typeof groceries>) =>
	compact({
		id: row.id,
		label: row.label,
		checked: row.checked,
		category: row.category,
	});

export const toTodo = (row: InferSelectModel<typeof todos>) => ({
	id: row.id,
	label: row.label,
	checked: row.checked,
});

/**
 * Shaped like the Firebase `User` the frontend stores today, so `useUserStore`
 * and every avatar/profile read keep working without a model change.
 */
export const toUser = (row: InferSelectModel<typeof users>) => ({
	uid: row.id,
	email: row.email,
	displayName: row.displayName,
	photoURL: row.photoUrl,
	isAdmin: row.isAdmin,
});
