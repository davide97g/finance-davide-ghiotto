import { useState, useEffect, useMemo } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { formatDate, MONTHS, openNotificationWithIcon, setIsLoading } from '../../services/utils';
import { DataBaseClient } from '../../api/db';
import { useCategoryStore } from '../../stores/category';
import { useTagStore } from '../../stores/tag';
import { ITransaction } from '../../models/transaction';

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	type: 'expense' | 'earning';
}

export default function NewTransactionPopup({ open, onOpenChange, type }: Props) {
	const newTransaction = (): Partial<ITransaction> => ({
		description: '',
		date: formatDate(new Date().toISOString()),
		category: '',
		type,
		month: MONTHS[new Date().getMonth()],
		year: new Date().getFullYear().toString(),
		tag: 'XB0kK9DnZIIEsPKsaWEB',
	});

	const [transaction, setTransaction] = useState<Partial<ITransaction>>(newTransaction());
	const allCategories = useCategoryStore(s => s.categories);
	const tags = useTagStore(s => s.tags);
	const categories = useMemo(() => allCategories.filter(c => c.type === type), [allCategories, type]);

	useEffect(() => {
		setTransaction(newTransaction());
	}, [type]);

	const updateField = (field: string, value: any) => {
		setTransaction(prev => {
			const updated = { ...prev, [field]: value };
			if (field === 'date' && value) {
				const dateObj = new Date(value);
				updated.month = MONTHS[dateObj.getMonth()];
				updated.year = dateObj.getFullYear().toString();
			}
			return updated;
		});
	};

	const handleOk = () => {
		setIsLoading(true);
		DataBaseClient.Transaction.create(transaction as ITransaction)
			.then(t => {
				openNotificationWithIcon('success', 'Success', 'Transaction ' + t.description + ' saved');
				setTransaction(newTransaction());
				onOpenChange(false);
			})
			.catch(err => console.error(err))
			.finally(() => setIsLoading(false));
	};

	const isDisabled = !transaction.amount || !transaction.date || !transaction.description || !transaction.category;

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>New {type}</DialogTitle>
				</DialogHeader>
				<div className="flex flex-col gap-3 items-start">
					<div className="w-full">
						<p className="text-sm mb-1">Date</p>
						<Input type="date" value={transaction.date || ''} onChange={e => updateField('date', e.target.value)} />
					</div>
					<div className="w-full">
						<p className="text-sm mb-1">Description</p>
						<Input type="text" value={transaction.description || ''} onChange={e => updateField('description', e.target.value)} placeholder="Enter a description" />
					</div>
					<div className="w-full">
						<p className="text-sm mb-1">Amount</p>
						<div className="flex items-center gap-2">
							<Input type="number" min={0} step={0.01} value={transaction.amount || ''} onChange={e => updateField('amount', parseFloat(e.target.value) || 0)} placeholder="Enter an amount" />
							<span>€</span>
						</div>
					</div>
					<div className="w-full">
						<p className="text-sm mb-1">Category</p>
						<Select value={transaction.category || ''} onValueChange={v => updateField('category', v)}>
							<SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
							<SelectContent>
								{categories.map(c => (
									<SelectItem key={c.id} value={c.id}>{c.name.toLowerCase()}</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
					<div className="w-full">
						<p className="text-sm mb-1">Tag</p>
						<Select value={transaction.tag || ''} onValueChange={v => updateField('tag', v)}>
							<SelectTrigger><SelectValue placeholder="Select tag" /></SelectTrigger>
							<SelectContent>
								{tags.map(t => (
									<SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>Return</Button>
					<Button onClick={handleOk} disabled={isDisabled}>Create</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
