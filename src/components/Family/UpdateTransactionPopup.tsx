import { useState, useEffect, useMemo } from 'react';
import { CalendarDays, FileText, Tag as TagIcon, FolderOpen, Euro } from 'lucide-react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent } from '../ui/dialog';
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
	const isExpense = transaction.type === 'expense';
	const accentColor = isExpense ? '#cf1322' : '#3f8600';
	const hasChanges = !equals(transaction, propTransaction);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="p-0 gap-0 overflow-hidden max-w-[360px] rounded-2xl border-0 shadow-2xl">
				{/* Colored header strip */}
				<div className="px-5 pt-5 pb-4" style={{ background: `linear-gradient(135deg, ${accentColor}12, ${accentColor}06)` }}>
					<div className="flex items-center gap-2 mb-3">
						<div className="h-2 w-2 rounded-full" style={{ backgroundColor: accentColor }} />
						<span className="text-xs font-semibold uppercase tracking-widest" style={{ color: accentColor }}>
							Edit {transaction.type}
						</span>
						{hasChanges && (
							<span className="ml-auto text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
								Modified
							</span>
						)}
					</div>
					{/* Hero amount field */}
					<div className="flex items-baseline gap-1 justify-center">
						<input
							type="number"
							min={0}
							step={0.01}
							value={transaction.amount}
							onChange={e => updateField('amount', parseFloat(e.target.value) || 0)}
							placeholder="0.00"
							className="bg-transparent border-none outline-none text-center text-4xl font-bold tracking-tight w-full placeholder:text-black/15"
							style={{ color: accentColor }}
						/>
						<Euro className="h-6 w-6 shrink-0 -ml-2 opacity-40" style={{ color: accentColor }} />
					</div>
				</div>

				{/* Form fields */}
				<div className="px-5 py-4 space-y-3">
					<div className="space-y-1.5">
						<Label className="text-xs text-muted-foreground flex items-center gap-1.5">
							<FileText className="h-3 w-3" /> Description
						</Label>
						<Input
							type="text"
							value={transaction.description}
							onChange={e => updateField('description', e.target.value)}
							placeholder="What was it for?"
							className="h-10 bg-white/80 border-black/8 rounded-xl text-sm placeholder:text-muted-foreground/50"
						/>
					</div>

					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1.5">
							<Label className="text-xs text-muted-foreground flex items-center gap-1.5">
								<CalendarDays className="h-3 w-3" /> Date
							</Label>
							<Input
								type="date"
								value={transaction.date}
								onChange={e => updateField('date', e.target.value)}
								className="h-10 bg-white/80 border-black/8 rounded-xl text-sm"
							/>
						</div>
						<div className="space-y-1.5">
							<Label className="text-xs text-muted-foreground flex items-center gap-1.5">
								<TagIcon className="h-3 w-3" /> Tag
							</Label>
							<Select value={transaction.tag || ''} onValueChange={v => updateField('tag', v)}>
								<SelectTrigger className="h-10 bg-white/80 border-black/8 rounded-xl text-sm">
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									{tags.map(t => (
										<SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="space-y-1.5">
						<Label className="text-xs text-muted-foreground flex items-center gap-1.5">
							<FolderOpen className="h-3 w-3" /> Category
						</Label>
						<Select value={transaction.category} onValueChange={v => updateField('category', v)}>
							<SelectTrigger className="h-10 bg-white/80 border-black/8 rounded-xl text-sm">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{categories.map(c => (
									<SelectItem key={c.id} value={c.id}>
										<span
											className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold text-white"
											style={{ backgroundColor: c.color || '#ababab' }}
										>
											{c.name}
										</span>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>

				{/* Actions */}
				<div className="px-5 pb-5 flex flex-col gap-2">
					<button
						onClick={handleOk}
						disabled={isDisabled}
						className="w-full h-11 rounded-xl font-semibold text-sm text-white transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
						style={{
							backgroundColor: isDisabled ? '#9ca3af' : accentColor,
							boxShadow: isDisabled ? 'none' : `0 4px 14px ${accentColor}40`,
						}}
					>
						Save changes
					</button>
					<button
						onClick={() => onOpenChange(false)}
						className="w-full h-9 rounded-xl text-sm text-muted-foreground hover:text-foreground transition-colors"
					>
						Cancel
					</button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
