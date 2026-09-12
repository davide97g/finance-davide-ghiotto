import type { Category, CategoryType, ICategory } from "../models/category";
import type { CategoryUsageData } from "../models/categoryUsage";
import type { Grocery, IGrocery } from "../models/grocery";
import type { IRecurring, Recurring } from "../models/recurring";
import type { IStats, Stats } from "../models/stats";
import type { ITag, Tag } from "../models/tag";
import type { ITodo, Todo } from "../models/todo";
import type { ITransaction, Transaction } from "../models/transaction";
import { setIsLoading } from "../stores/loading";
import { trackWrite } from "../stores/sync";
import { api, toQuery } from "./http";
import {
	type Collection,
	onCollectionChange,
	type Unsubscribe,
} from "./realtime";

export type { Unsubscribe };

/**
 * Single API layer for the app, now backed by the Postgres service instead of
 * Firestore. Every method keeps the signature the components already call, so
 * the UI is unchanged: `get*` resolve arrays, `create` resolves the stored row
 * with its id, `getRT` resolves an unsubscribe function.
 *
 * Real-time works differently underneath: the server pushes "collection X
 * changed" over SSE and `getRT` re-reads that collection, where Firestore used
 * to push the documents themselves.
 */
const liveQuery = async <T>(
	collection: Collection,
	read: () => Promise<T[]>,
	callback: (items: T[]) => void,
): Promise<Unsubscribe> => {
	let active = true;

	const refresh = async () => {
		try {
			const items = await read();
			if (active) callback(items);
		} catch (error) {
			console.error(`failed to read ${collection}`, error);
		}
	};

	const unsubscribe = onCollectionChange(collection, refresh);
	await refresh();

	return () => {
		active = false;
		unsubscribe();
	};
};

export const DataBaseClient = {
	Transaction: {
		collection: "transactions" as const,
		async get(filters?: {
			type?: "expense" | "earning";
			month?: string;
			year?: string;
		}): Promise<Transaction[]> {
			setIsLoading(true);
			try {
				return await api.get<Transaction[]>(
					`/transactions${toQuery({ ...filters })}`,
				);
			} finally {
				setIsLoading(false);
			}
		},
		getRT(
			callback: (transactions: Transaction[]) => void,
			filters?: {
				type?: "expense" | "earning";
				month?: string;
				year?: string;
			},
		): Promise<Unsubscribe> {
			return liveQuery(
				"transactions",
				() => api.get<Transaction[]>(`/transactions${toQuery({ ...filters })}`),
				callback,
			);
		},
		create(transaction: ITransaction): Promise<Transaction> {
			return trackWrite(
				api.post<Transaction>("/transactions", transaction),
				"transaction create",
			);
		},
		async update(transaction: Transaction): Promise<boolean> {
			// `pending` is a client-side sync flag, never part of the stored row.
			const { pending: _pending, id, ...payload } = transaction;
			await trackWrite(
				api.put(`/transactions/${id}`, payload),
				"transaction update",
			);
			return true;
		},
		async delete(transactionId: string): Promise<boolean> {
			await trackWrite(
				api.delete(`/transactions/${transactionId}`),
				"transaction delete",
			);
			return true;
		},
		bulkAdd(transactions: ITransaction[]): Promise<Transaction[]> {
			return trackWrite(
				api.post<Transaction[]>("/transactions/bulk", transactions),
				"transaction bulk add",
			);
		},
	},
	Category: {
		collection: "categories" as const,
		get(type?: CategoryType): Promise<Category[]> {
			return api.get<Category[]>(`/categories${toQuery({ type })}`);
		},
		create(iCategory: ICategory): Promise<Category> {
			return trackWrite(
				api.post<Category>("/categories", iCategory),
				"category create",
			);
		},
		async update(category: Category): Promise<boolean> {
			const { id, ...payload } = category;
			await trackWrite(
				api.put(`/categories/${id}`, payload),
				"category update",
			);
			return true;
		},
		async delete(categoryId: string): Promise<boolean> {
			await trackWrite(
				api.delete(`/categories/${categoryId}`),
				"category delete",
			);
			return true;
		},
	},
	Tag: {
		collection: "tags" as const,
		get(): Promise<Tag[]> {
			return api.get<Tag[]>("/tags");
		},
		create(iTag: ITag): Promise<Tag> {
			return trackWrite(api.post<Tag>("/tags", iTag), "tag create");
		},
		async update(tag: Tag): Promise<boolean> {
			const { id, ...payload } = tag;
			await trackWrite(api.put(`/tags/${id}`, payload), "tag update");
			return true;
		},
		async delete(tagId: string): Promise<boolean> {
			await trackWrite(api.delete(`/tags/${tagId}`), "tag delete");
			return true;
		},
	},
	Recurring: {
		collection: "recurring" as const,
		get(): Promise<Recurring[]> {
			return api.get<Recurring[]>("/recurring");
		},
		create(iRecurring: IRecurring): Promise<Recurring> {
			return trackWrite(
				api.post<Recurring>("/recurring", iRecurring),
				"recurring create",
			);
		},
		async update(recurring: Recurring): Promise<boolean> {
			const { id, ...payload } = recurring;
			await trackWrite(
				api.put(`/recurring/${id}`, payload),
				"recurring update",
			);
			return true;
		},
		async delete(recurringId: string): Promise<boolean> {
			await trackWrite(
				api.delete(`/recurring/${recurringId}`),
				"recurring delete",
			);
			return true;
		},
	},
	Stats: {
		collection: "stats" as const,
		async get(month: string, year: string): Promise<Stats> {
			const rows = await api.get<Stats[]>(`/stats${toQuery({ month, year })}`);
			return rows[0];
		},
		getByYear(year: string): Promise<Stats[]> {
			return api.get<Stats[]>(`/stats${toQuery({ year })}`);
		},
		getAllYears(): Promise<Stats[]> {
			return api.get<Stats[]>("/stats");
		},
		create(iStats: IStats): Promise<Stats> {
			return trackWrite(api.post<Stats>("/stats", iStats), "stats create");
		},
		async update(stats: Stats): Promise<boolean> {
			const { id, ...payload } = stats;
			await trackWrite(api.put(`/stats/${id}`, payload), "stats update");
			return true;
		},
		async delete(statsId: string): Promise<boolean> {
			await trackWrite(api.delete(`/stats/${statsId}`), "stats delete");
			return true;
		},
		async bulkDelete(statsIds: string[]): Promise<boolean> {
			await trackWrite(
				api.post("/stats/bulk-delete", { ids: statsIds }),
				"stats bulk delete",
			);
			return true;
		},
		bulkAdd(stats: IStats[]): Promise<Stats[]> {
			return trackWrite(
				api.post<Stats[]>("/stats/bulk", stats),
				"stats bulk add",
			);
		},
	},
	Grocery: {
		collection: "groceries" as const,
		async get(): Promise<Grocery[]> {
			setIsLoading(true);
			try {
				return await api.get<Grocery[]>("/groceries");
			} finally {
				setIsLoading(false);
			}
		},
		getRT(callback: (groceries: Grocery[]) => void): Promise<Unsubscribe> {
			return liveQuery(
				"groceries",
				() => api.get<Grocery[]>("/groceries"),
				callback,
			);
		},
		create(grocery: IGrocery): Promise<Grocery> {
			return trackWrite(
				api.post<Grocery>("/groceries", grocery),
				"grocery create",
			);
		},
		async update(grocery: Grocery): Promise<boolean> {
			const { id, ...payload } = grocery;
			await trackWrite(api.put(`/groceries/${id}`, payload), "grocery update");
			return true;
		},
		async delete(groceryId: string): Promise<boolean> {
			await trackWrite(api.delete(`/groceries/${groceryId}`), "grocery delete");
			return true;
		},
	},
	Todo: {
		collection: "todo" as const,
		async get(): Promise<Todo[]> {
			setIsLoading(true);
			try {
				return await api.get<Todo[]>("/todo");
			} finally {
				setIsLoading(false);
			}
		},
		getRT(callback: (todos: Todo[]) => void): Promise<Unsubscribe> {
			return liveQuery("todo", () => api.get<Todo[]>("/todo"), callback);
		},
		create(todo: ITodo): Promise<Todo> {
			return trackWrite(api.post<Todo>("/todo", todo), "todo create");
		},
		async update(todo: Todo): Promise<boolean> {
			const { id, ...payload } = todo;
			await trackWrite(api.put(`/todo/${id}`, payload), "todo update");
			return true;
		},
		async delete(todoId: string): Promise<boolean> {
			await trackWrite(api.delete(`/todo/${todoId}`), "todo delete");
			return true;
		},
	},
	CategoryUsage: {
		get(): Promise<CategoryUsageData | null> {
			return api.get<CategoryUsageData | null>("/settings/categoryUsage");
		},
		async set(data: CategoryUsageData): Promise<void> {
			await trackWrite(
				api.put("/settings/categoryUsage", data),
				"category usage set",
			);
		},
	},
};
