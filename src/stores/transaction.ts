import { create } from 'zustand';
import { Transaction } from '../models/transaction';

interface TransactionState {
	expenses: Transaction[];
	earnings: Transaction[];
	sorting: 'descending' | 'ascending';
	setTransactions: (transactions: Transaction[]) => void;
	bulkAddTransactions: (transactions: Transaction[]) => void;
	addTransaction: (transaction: Transaction) => void;
	removeTransaction: (transaction: Transaction) => void;
	updateTransaction: (transaction: Transaction) => void;
	bulkUpdateTransactions: (transactions: Transaction[]) => void;
	sortTransactions: (ascending?: boolean) => void;
}

const sortByDate = (list: Transaction[], ascending: boolean) =>
	[...list].sort(
		(t1, t2) =>
			(new Date(t1.date).getTime() - new Date(t2.date).getTime()) * (ascending ? 1 : -1)
	);

export const useTransactionStore = create<TransactionState>((set, get) => ({
	expenses: [],
	earnings: [],
	sorting: 'descending',
	setTransactions: (transactions: Transaction[]) => {
		const { earnings, expenses } = get();
		const newTransactions = transactions.filter(
			e => !earnings.find(t => t.id === e.id) && !expenses.find(t => t.id === e.id)
		);
		const presentTransactions = transactions.filter(
			e => earnings.find(t => t.id === e.id) || expenses.find(t => t.id === e.id)
		);
		get().bulkAddTransactions(newTransactions);
		get().bulkUpdateTransactions(presentTransactions);
	},
	bulkAddTransactions: (transactions: Transaction[]) => {
		set(state => {
			const newExpenses = [...state.expenses];
			const newEarnings = [...state.earnings];
			transactions.forEach(transaction => {
				if (transaction.type === 'earning') {
					if (newEarnings.findIndex(t => t.id === transaction.id) === -1)
						newEarnings.push(transaction);
				} else {
					if (newExpenses.findIndex(t => t.id === transaction.id) === -1)
						newExpenses.push(transaction);
				}
			});
			const ascending = state.sorting === 'ascending';
			return {
				expenses: sortByDate(newExpenses, ascending),
				earnings: sortByDate(newEarnings, ascending),
			};
		});
	},
	addTransaction: (transaction: Transaction) => {
		set(state => {
			if (transaction.type === 'earning') {
				if (state.earnings.findIndex(t => t.id === transaction.id) !== -1) return state;
				const newEarnings = [...state.earnings, transaction];
				return {
					earnings: sortByDate(newEarnings, state.sorting === 'ascending'),
				};
			} else {
				if (state.expenses.findIndex(t => t.id === transaction.id) !== -1) return state;
				const newExpenses = [...state.expenses, transaction];
				return {
					expenses: sortByDate(newExpenses, state.sorting === 'ascending'),
				};
			}
		});
	},
	removeTransaction: (transaction: Transaction) => {
		set(state => {
			if (transaction.type === 'earning') {
				return {
					earnings: state.earnings.filter(t => t.id !== transaction.id),
				};
			} else {
				return {
					expenses: state.expenses.filter(t => t.id !== transaction.id),
				};
			}
		});
	},
	updateTransaction: (transaction: Transaction) => {
		set(state => {
			if (transaction.type === 'expense') {
				return {
					expenses: state.expenses.map(t => (t.id === transaction.id ? transaction : t)),
				};
			} else {
				return {
					earnings: state.earnings.map(t => (t.id === transaction.id ? transaction : t)),
				};
			}
		});
	},
	bulkUpdateTransactions: (transactions: Transaction[]) => {
		set(state => {
			let newExpenses = [...state.expenses];
			let newEarnings = [...state.earnings];
			transactions.forEach(transaction => {
				if (transaction.type === 'expense') {
					newExpenses = newExpenses.map(t =>
						t.id === transaction.id ? transaction : t
					);
				} else {
					newEarnings = newEarnings.map(t =>
						t.id === transaction.id ? transaction : t
					);
				}
			});
			const ascending = state.sorting === 'ascending';
			return {
				expenses: sortByDate(newExpenses, ascending),
				earnings: sortByDate(newEarnings, ascending),
			};
		});
	},
	sortTransactions: (ascending?: boolean) => {
		set(state => ({
			sorting: ascending ? 'ascending' : 'descending',
			expenses: sortByDate(state.expenses, !!ascending),
			earnings: sortByDate(state.earnings, !!ascending),
		}));
	},
}));
