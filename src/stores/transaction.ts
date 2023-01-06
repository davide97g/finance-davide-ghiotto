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
		setEarnings(earnings: Transaction[]) {
			this.earnings = earnings;
		},
		setExpenses(expenses: Transaction[]) {
			this.expenses = expenses;
		},
		addTransaction(transaction: Transaction) {
			if (transaction.type === 'earning') this.earnings.push(transaction);
			else this.expenses.push(transaction);
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
		},
	},
});
