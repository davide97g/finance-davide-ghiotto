import { useMemo, useState } from "react";
import type { CategoryType } from "../../models/category";
import type { Transaction } from "../../models/transaction";
import TransactionItem from "../TransactionItem";
import UpdateTransactionPopup from "./UpdateTransactionPopup";

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

export default function TransactionList({
	title: _title,
	type: _type,
	transactions: rawTransactions,
	search,
	filters = {},
}: Props) {
	const [selectedTransaction, setSelectedTransaction] = useState<
		Transaction | undefined
	>();
	const [updatePopupVisible, setUpdatePopupVisible] = useState(false);

	const transactions = useMemo(() => {
		let filtered = rawTransactions;
		if (filters.categoryIds?.length) {
			filtered = filtered.filter((t) =>
				filters.categoryIds?.includes(t.category),
			);
		}
		if (search) {
			filtered = filtered.filter((t) =>
				t.description.toLowerCase().includes(search.toLowerCase()),
			);
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
			<div className="w-full h-[calc(100dvh-260px)] overflow-auto p-2 pb-14 bg-secondary shadow-[inset_0_1px_3px_rgba(0,0,0,0.06)] dark:shadow-[inset_0_1px_3px_rgba(0,0,0,0.2)] rounded-xl space-y-1.5">
				{transactions.map((item) => (
					// biome-ignore lint/a11y/useSemanticElements: wrapper div with role="button" is intentional to preserve styling
					<div
						key={item.id}
						role="button"
						tabIndex={0}
						className="cursor-pointer rounded-xl hover:shadow-[0_2px_8px_rgba(0,0,0,0.1)] active:scale-[0.995] transition-all duration-100"
						onClick={() => openTransactionDetails(item)}
						onKeyDown={(e) => {
							if (e.key === "Enter" || e.key === " ") {
								e.preventDefault();
								openTransactionDetails(item);
							}
						}}
					>
						<TransactionItem item={item} />
					</div>
				))}
			</div>
		</>
	);
}
