import { defineStore } from 'pinia';
import { Transaction } from '../models/transaction';

export const useTransactionStore = defineStore('transaction', {
	state: () => {
		return {
			expenses: [] as Transaction[],
			earnings: [] as Transaction[],
		};
	},
	actions: {
		setTransactions(transactions: Transaction[]) {
			this.earnings = transactions.filter(t => t.type === 'earning');
			this.expenses = transactions.filter(t => t.type === 'expense');
			this.sortTransactions();
		},
		addTransaction(transaction: Transaction) {
			if (transaction.type === 'earning') this.earnings.push(transaction);
			else this.expenses.push(transaction);
			this.sortTransactions();
		},
		removeTransaction(transaction: Transaction) {
			if (transaction.type === 'earning')
				this.earnings.splice(
					this.earnings.findIndex(t => t.id === transaction.id),
					1
				);
			else
				this.expenses.splice(
					this.expenses.findIndex(t => t.id === transaction.id),
					1
				);
			this.sortTransactions();
		},
		sortTransactions(ascending?: boolean) {
			this.expenses = this.expenses.sort(
				(t1, t2) =>
					(new Date(t1.date).getTime() - new Date(t2.date).getTime()) *
					(ascending ? 1 : -1)
			);
			this.earnings = this.earnings.sort(
				(t1, t2) =>
					(new Date(t1.date).getTime() - new Date(t2.date).getTime()) *
					(ascending ? 1 : -1)
			);
		},
	},
});
