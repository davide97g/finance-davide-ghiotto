import { defineStore } from 'pinia';
import { Transaction } from '../models/transaction';

export const useTransactionStore = defineStore('transaction', {
	state: () => {
		return {
			transactions: [] as Transaction[],
		};
	},
	actions: {
		setTransactions(transactions: Transaction[]) {
			this.transactions = transactions;
		},
	},
});
