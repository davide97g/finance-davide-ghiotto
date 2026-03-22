import { Trash2, Calendar } from 'lucide-react';
import { Badge } from './ui/badge';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from './ui/alert-dialog';
import CategoryBadge from './Badges/CategoryBadge';
import TagBadge from './Badges/TagBadge';
import { Transaction } from '../models/transaction';
import { formatDate, openNotificationWithIcon } from '../services/utils';
import { useTransactionStore } from '../stores/transaction';
import { useCategoryStore } from '../stores/category';
import { useTagStore } from '../stores/tag';
import { DataBaseClient } from '../api/db';

interface Props {
	item: Transaction;
}

export default function TransactionItem({ item }: Props) {
	const categories = useCategoryStore(s => s.categories);
	const tags = useTagStore(s => s.tags);
	const removeTransaction = useTransactionStore(s => s.removeTransaction);

	const getCategory = (categoryId: string) => categories.find(c => c.id === categoryId);
	const getTag = (tagId?: string) => tags.find(t => t.id === tagId);

	const deleteTransaction = (e: React.MouseEvent) => {
		e.stopPropagation();
		DataBaseClient.Transaction.delete(item.id)
			.then(() => {
				openNotificationWithIcon('success', 'Success', 'Deleted transaction with id: ' + item.id);
				removeTransaction(item);
			})
			.catch(err => {
				console.error(err);
				openNotificationWithIcon('error', 'Error', 'Failed deleting transaction with id:' + item.id);
			});
	};

	const category = getCategory(item.category);
	const tag = getTag(item.tag);

	return (
		<div className="relative w-full pr-[5px] flex flex-col gap-2">
			<div className="flex w-full">
				<div className="w-2/3 text-left truncate capitalize flex items-center gap-1">
					<strong>{item.description}</strong>
				</div>
				<div className="w-1/3 text-right flex justify-end items-center gap-1">
					{category?.excludeFromBudget && (
						<Badge variant="secondary" className="text-xs">E</Badge>
					)}
					<span className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">{item.amount} €</span>
				</div>
			</div>
			<div className="flex w-full items-center">
				<div className="w-1/5 text-left">
					<span className="bg-muted px-1 py-0.5 rounded text-xs font-mono">
						{formatDate(item.date, true)} <Calendar className="inline h-3 w-3" />
					</span>
				</div>
				<div className="w-[54%] text-left">
					{category && <CategoryBadge category={category} />}
				</div>
				<div className="w-[17%] text-left">
					{tag && item.tag !== 'XB0kK9DnZIIEsPKsaWEB' && <TagBadge tag={tag} />}
				</div>
				<div className="w-[8%] text-center" onClick={e => e.stopPropagation()}>
					<AlertDialog>
						<AlertDialogTrigger asChild>
							<Trash2 className="h-4 w-4 cursor-pointer text-muted-foreground hover:text-destructive" />
						</AlertDialogTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Are you sure delete this transaction?</AlertDialogTitle>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>No</AlertDialogCancel>
								<AlertDialogAction onClick={deleteTransaction}>Yes</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</div>
			</div>
		</div>
	);
}
