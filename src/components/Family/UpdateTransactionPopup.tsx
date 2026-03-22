import { useState, useEffect, useMemo } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { clone, equals, openNotificationWithIcon, setIsLoading } from '../../services/utils';
import { DataBaseClient } from '../../api/db';
import { useCategoryStore } from '../../stores/category';
import { useTagStore } from '../../stores/tag';
import { useTransactionStore } from '../../stores/transaction';
import { Transaction } from '../../models/transaction';

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	transaction: Transaction;
}

export default function UpdateTransactionPopup({ open, onOpenChange, transaction: propTransaction }: Props) {
	const [transaction, setTransaction] = useState<Transaction>(clone(propTransaction));
	const allCategories = useCategoryStore(s => s.categories);
	const tags = useTagStore(s => s.tags);
	const categories = useMemo(() => allCategories.filter(c => c.type === transaction.type), [allCategories, transaction.type]);

	useEffect(() => {
		setTransaction(clone(propTransaction));
	}, [propTransaction]);

	const updateField = (field: string, value: any) => {
		setTransaction(prev => ({ ...prev, [field]: value }));
	};

	const handleOk = () => {
		setIsLoading(true);
		DataBaseClient.Transaction.update(transaction)
			.then(() => {
				openNotificationWithIcon('success', 'Success', 'Transaction ' + transaction.description + ' updated');
				useTransactionStore.getState().updateTransaction(transaction);
				onOpenChange(false);
			})
			.catch(err => console.error(err))
			.finally(() => setIsLoading(false));
	};

	const isDisabled = !transaction.amount || !transaction.date || !transaction.description || !transaction.category || equals(transaction, propTransaction);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Update Transaction</DialogTitle>
				</DialogHeader>
				<div className="flex flex-col gap-3 items-start">
					<div className="w-full">
						<p className="text-sm mb-1">Date</p>
						<Input type="date" value={transaction.date} onChange={e => updateField('date', e.target.value)} />
					</div>
					<div className="w-full">
						<p className="text-sm mb-1">Description</p>
						<Input type="text" value={transaction.description} onChange={e => updateField('description', e.target.value)} placeholder="Enter a description" />
					</div>
					<div className="w-full">
						<p className="text-sm mb-1">Amount</p>
						<div className="flex items-center gap-2">
							<Input type="number" min={0} step={0.01} value={transaction.amount} onChange={e => updateField('amount', parseFloat(e.target.value) || 0)} placeholder="Enter an amount" />
							<span>€</span>
						</div>
					</div>
					<div className="w-full">
						<p className="text-sm mb-1">Category</p>
						<Select value={transaction.category} onValueChange={v => updateField('category', v)}>
							<SelectTrigger><SelectValue /></SelectTrigger>
							<SelectContent>
								{categories.map(c => (
									<SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="w-full">
						<p className="text-sm mb-1">Tag</p>
						<Select value={transaction.tag || ''} onValueChange={v => updateField('tag', v)}>
							<SelectTrigger><SelectValue /></SelectTrigger>
							<SelectContent>
								{tags.map(t => (
									<SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
					<Button onClick={handleOk} disabled={isDisabled}>Update</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
