import { defineStore } from 'pinia';
import { Transaction } from '../models/transaction';

export const useTransactionStore = defineStore('transaction', {
	state: () => {
		return {
			expenses: [] as Transaction[],
			earnings: [] as Transaction[],
			sorting: 'descending' as 'descending' | 'ascending',
		};
	},
	actions: {
		setTransactions(transactions: Transaction[]) {
			const newTransactions = transactions.filter(
				e =>
					!this.earnings.find(t => t.id === e.id) &&
					!this.expenses.find(t => t.id === e.id)
			);
			newTransactions.forEach(t => this.addTransaction(t));

			const presentTransactions = transactions.filter(
				e =>
					this.earnings.find(t => t.id === e.id) || this.expenses.find(t => t.id === e.id)
			);
			presentTransactions.forEach(t => this.updateTransaction(t));
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
		updateTransaction(transaction: Transaction) {
			const transactions = transaction.type === 'expense' ? this.expenses : this.earnings;
			const i = transactions.findIndex(t => t.id === transaction.id);
			transactions[i] = transaction;
		},
		sortTransactions(ascending?: boolean) {
			this.sorting = ascending ? 'ascending' : 'descending';
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
