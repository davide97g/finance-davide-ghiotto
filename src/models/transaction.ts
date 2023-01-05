export interface ITransaction {
	date: string;
	amount: number;
	description: string;
	category: string;
	type: 'expense' | 'earning';
}

export const EarningCategories = ['salary', 'investment', 'gift', 'refund', 'other'];
export const ExpenseCategories = [
	'travel',
	'house',
	'sport 🏆',
	'health',
	'beauty 🌺',
	'groceries',
	'petrol ⛽',
	'party 🎉',
	'clothes',
	'food & drink 🍔',
	'bills & taxes 🧾',
	'other',
];
