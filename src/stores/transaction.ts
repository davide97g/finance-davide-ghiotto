import { create } from "zustand";
import type { Transaction } from "../models/transaction";

interface TransactionState {
	expenses: Transaction[];
	earnings: Transaction[];
	sorting: "descending" | "ascending";
	setTransactions: (transactions: Transaction[]) => void;
	bulkAddTransactions: (transactions: Transaction[]) => void;
	addTransaction: (transaction: Transaction) => void;
	removeTransaction: (transaction: Transaction) => void;
	updateTransaction: (transaction: Transaction) => void;
	bulkUpdateTransactions: (transactions: Transaction[]) => void;
	sortTransactions: (ascending?: boolean) => void;
}

const dayMs = (t: Transaction) => new Date(t.date).getTime();

/** Same calendar day: newer createdAt first when date order is descending (and older first when ascending). */
const compareTransactions = (
	t1: Transaction,
	t2: Transaction,
	ascending: boolean,
): number => {
	const d1 = dayMs(t1);
	const d2 = dayMs(t2);
	if (d1 !== d2) {
		return ascending ? d1 - d2 : d2 - d1;
	}
	const c1 = t1.createdAt ?? 0;
	const c2 = t2.createdAt ?? 0;
	if (c1 !== c2) {
		return ascending ? c1 - c2 : c2 - c1;
	}
	return ascending ? t1.id.localeCompare(t2.id) : t2.id.localeCompare(t1.id);
};

const sortByDate = (list: Transaction[], ascending: boolean) =>
	[...list].sort((a, b) => compareTransactions(a, b, ascending));

export const useTransactionStore = create<TransactionState>((set, get) => ({
	expenses: [],
	earnings: [],
	sorting: "descending",
	setTransactions: (transactions: Transaction[]) => {
		const { earnings, expenses } = get();
		const newTransactions = transactions.filter(
			(e) =>
				!earnings.find((t) => t.id === e.id) &&
				!expenses.find((t) => t.id === e.id),
		);
		const presentTransactions = transactions.filter(
			(e) =>
				earnings.find((t) => t.id === e.id) ||
				expenses.find((t) => t.id === e.id),
		);
		get().bulkAddTransactions(newTransactions);
		get().bulkUpdateTransactions(presentTransactions);
	},
	bulkAddTransactions: (transactions: Transaction[]) => {
		set((state) => {
			const newExpenses = [...state.expenses];
			const newEarnings = [...state.earnings];
			transactions.forEach((transaction) => {
				if (transaction.type === "earning") {
					if (newEarnings.findIndex((t) => t.id === transaction.id) === -1)
						newEarnings.push(transaction);
				} else {
					if (newExpenses.findIndex((t) => t.id === transaction.id) === -1)
						newExpenses.push(transaction);
				}
			});
			const ascending = state.sorting === "ascending";
			return {
				expenses: sortByDate(newExpenses, ascending),
				earnings: sortByDate(newEarnings, ascending),
			};
		});
	},
	addTransaction: (transaction: Transaction) => {
		set((state) => {
			if (transaction.type === "earning") {
				if (state.earnings.findIndex((t) => t.id === transaction.id) !== -1)
					return state;
				const newEarnings = [...state.earnings, transaction];
				return {
					earnings: sortByDate(newEarnings, state.sorting === "ascending"),
				};
			} else {
				if (state.expenses.findIndex((t) => t.id === transaction.id) !== -1)
					return state;
				const newExpenses = [...state.expenses, transaction];
				return {
					expenses: sortByDate(newExpenses, state.sorting === "ascending"),
				};
			}
		});
	},
	removeTransaction: (transaction: Transaction) => {
		set((state) => {
			if (transaction.type === "earning") {
				return {
					earnings: state.earnings.filter((t) => t.id !== transaction.id),
				};
			} else {
				return {
					expenses: state.expenses.filter((t) => t.id !== transaction.id),
				};
			}
		});
	},
	updateTransaction: (transaction: Transaction) => {
		set((state) => {
			const ascending = state.sorting === "ascending";
			if (transaction.type === "expense") {
				const next = state.expenses.map((t) =>
					t.id === transaction.id ? transaction : t,
				);
				return { expenses: sortByDate(next, ascending) };
			}
			const next = state.earnings.map((t) =>
				t.id === transaction.id ? transaction : t,
			);
			return { earnings: sortByDate(next, ascending) };
		});
	},
	bulkUpdateTransactions: (transactions: Transaction[]) => {
		set((state) => {
			let newExpenses = [...state.expenses];
			let newEarnings = [...state.earnings];
			transactions.forEach((transaction) => {
				if (transaction.type === "expense") {
					newExpenses = newExpenses.map((t) =>
						t.id === transaction.id ? transaction : t,
					);
				} else {
					newEarnings = newEarnings.map((t) =>
						t.id === transaction.id ? transaction : t,
					);
				}
			});
			const ascending = state.sorting === "ascending";
			return {
				expenses: sortByDate(newExpenses, ascending),
				earnings: sortByDate(newEarnings, ascending),
			};
		});
	},
	sortTransactions: (ascending?: boolean) => {
		set((state) => ({
			sorting: ascending ? "ascending" : "descending",
			expenses: sortByDate(state.expenses, !!ascending),
			earnings: sortByDate(state.earnings, !!ascending),
		}));
	},
}));
