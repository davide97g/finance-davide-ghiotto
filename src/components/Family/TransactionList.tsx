import { useState, useMemo } from 'react';
import { ArrowUp, ArrowDown, Filter } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import TransactionItem from '../TransactionItem';
import FiltersPopup from './FiltersPopup';
import UpdateTransactionPopup from './UpdateTransactionPopup';
import { Transaction } from '../../models/transaction';
import { CategoryType } from '../../models/category';
import { useTransactionStore } from '../../stores/transaction';

export interface Filters {
	categoryIds?: string[];
}

interface Props {
	title: string;
	type: CategoryType;
	transactions: Transaction[];
	search?: string;
}

export default function TransactionList({ title, type, transactions: rawTransactions, search }: Props) {
	const [filters, setFilters] = useState<Filters>({});
	const [filtersPopupVisible, setFiltersPopupVisible] = useState(false);
	const [selectedTransaction, setSelectedTransaction] = useState<Transaction | undefined>();
	const [updatePopupVisible, setUpdatePopupVisible] = useState(false);
	const sorting = useTransactionStore(s => s.sorting);
	const sortTransactions = useTransactionStore(s => s.sortTransactions);

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

	const filterTransactions = (newFilters: Filters) => {
		setFilters(newFilters);
		setFiltersPopupVisible(false);
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
			<div className="w-full h-[calc(100vh-410px)] overflow-auto p-2.5 pb-5 bg-[#e2f0e2] shadow-[inset_0_0_12px_#ccc]">
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
			<div className="flex items-center justify-around mt-2.5 h-[30px]">
				<Button variant="link" disabled={sorting === 'ascending'} onClick={() => sortTransactions(true)}>
					<ArrowUp className="mr-1 h-3 w-3" /> Old
				</Button>
				<Button variant="link" disabled={sorting === 'descending'} onClick={() => sortTransactions(false)}>
					<ArrowDown className="mr-1 h-3 w-3" /> Recent
				</Button>
				<Button variant="link" onClick={() => setFiltersPopupVisible(true)}>
					<Filter className="mr-1 h-3 w-3" /> Filter
					{filters.categoryIds?.length ? (
						<Badge className="ml-1 h-5 w-5 flex items-center justify-center rounded-full p-0 text-xs">
							{filters.categoryIds.length}
						</Badge>
					) : null}
				</Button>
			</div>
			<FiltersPopup
				type={type}
				open={filtersPopupVisible}
				onOpenChange={setFiltersPopupVisible}
				filters={filters}
				onApply={filterTransactions}
			/>
		</>
	);
}
