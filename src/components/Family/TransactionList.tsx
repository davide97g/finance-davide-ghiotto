import { useState, useMemo } from 'react';
import TransactionItem from '../TransactionItem';
import UpdateTransactionPopup from './UpdateTransactionPopup';
import { Transaction } from '../../models/transaction';
import { CategoryType } from '../../models/category';

export interface Filters {
	categoryIds?: string[];
}

interface Props {
	title: string;
	type: CategoryType;
	transactions: Transaction[];
	search?: string;
	filters?: Filters;
}

export default function TransactionList({ title, type, transactions: rawTransactions, search, filters = {} }: Props) {
	const [selectedTransaction, setSelectedTransaction] = useState<Transaction | undefined>();
	const [updatePopupVisible, setUpdatePopupVisible] = useState(false);

	const transactions = useMemo(() => {
		let filtered = rawTransactions;
		if (filters.categoryIds?.length) {
			filtered = filtered.filter(t => filters.categoryIds?.includes(t.category));
		}
		if (search) {
			filtered = filtered.filter(t => t.description.toLowerCase().includes(search.toLowerCase()));
		}
		return filtered;
	}, [rawTransactions, filters, search]);

	const openTransactionDetails = (transaction: Transaction) => {
		setSelectedTransaction(transaction);
		setUpdatePopupVisible(true);
	};

	return (
		<>
			{selectedTransaction && (
				<UpdateTransactionPopup
					open={updatePopupVisible}
					onOpenChange={setUpdatePopupVisible}
					transaction={selectedTransaction}
				/>
			)}
			<div className="w-full h-[calc(100vh-330px)] overflow-auto p-2.5 pb-5 bg-[#e2f0e2] shadow-[inset_0_0_12px_#ccc]">
				{transactions.map(item => (
					<div
						key={item.id}
						className="text-left py-2 border-b-2 cursor-pointer"
						onClick={() => openTransactionDetails(item)}
					>
						<TransactionItem item={item} />
					</div>
				))}
			</div>
		</>
	);
}
