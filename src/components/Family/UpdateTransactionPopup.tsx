import {
	CalendarDays,
	Euro,
	FileText,
	FolderOpen,
	Tag as TagIcon,
	Trash2,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { DataBaseClient } from "../../api/db";
import { cn } from "../../lib/utils";
import type { Transaction } from "../../models/transaction";
import {
	clone,
	equals,
	openNotificationWithIcon,
	setIsLoading,
} from "../../services/utils";
import { useCategoryStore } from "../../stores/category";
import { useCategoryUsageStore } from "../../stores/categoryUsage";
import { useTagStore } from "../../stores/tag";
import { useTransactionStore } from "../../stores/transaction";
import { Dialog, DialogContent, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../ui/select";

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	transaction: Transaction;
}

function TagChip({
	value,
	tags,
	onChange,
}: {
	value: string;
	tags: { id: string; name: string }[];
	onChange: (v: string) => void;
}) {
	const [expanded, setExpanded] = useState(false);
	const ref = useRef<HTMLDivElement>(null);
	const current = tags.find((t) => t.id === value);

	useEffect(() => {
		const handleClick = (e: MouseEvent) => {
			if (ref.current && !ref.current.contains(e.target as Node))
				setExpanded(false);
		};
		if (expanded) document.addEventListener("mousedown", handleClick);
		return () => document.removeEventListener("mousedown", handleClick);
	}, [expanded]);

	return (
		<div ref={ref} className="relative">
			<button
				type="button"
				onClick={() => setExpanded(!expanded)}
				className={cn(
					"flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full transition-all duration-200",
					expanded
						? "bg-foreground/10 text-foreground"
						: "bg-foreground/[0.05] text-muted-foreground hover:bg-foreground/[0.08]",
				)}
			>
				<TagIcon className="h-2.5 w-2.5" />
				{current?.name || "Tag"}
			</button>

			{expanded && (
				<div
					className="absolute right-0 top-full mt-1.5 z-50 bg-white rounded-xl shadow-lg border border-black/[0.06] p-1.5 flex flex-wrap gap-1 min-w-[140px] max-w-[200px]"
					style={{ animation: "fadeSlideIn 0.15s ease-out both" }}
				>
					{tags.map((t) => (
						<button
							type="button"
							key={t.id}
							onClick={() => {
								onChange(t.id);
								setExpanded(false);
							}}
							className={cn(
								"text-[10px] font-medium px-2.5 py-1 rounded-lg transition-all duration-150 whitespace-nowrap",
								t.id === value
									? "bg-foreground/10 text-foreground shadow-sm"
									: "text-muted-foreground hover:bg-foreground/[0.05] hover:text-foreground",
							)}
						>
							{t.name}
						</button>
					))}
				</div>
			)}
		</div>
	);
}

export default function UpdateTransactionPopup({
	open,
	onOpenChange,
	transaction: propTransaction,
}: Props) {
	const [transaction, setTransaction] = useState<Transaction>(
		clone(propTransaction),
	);
	const [amountDisplay, setAmountDisplay] = useState(
		String(propTransaction.amount || ""),
	);
	const [confirmingDelete, setConfirmingDelete] = useState(false);
	const removeTransaction = useTransactionStore((s) => s.removeTransaction);
	const allCategories = useCategoryStore((s) => s.categories);
	const usageCounts = useCategoryUsageStore((s) => s.counts);
	const tags = useTagStore((s) => s.tags);
	const categories = useMemo(() => {
		const filtered = allCategories.filter((c) => c.type === transaction.type);
		if (transaction.type === "expense") {
			return [...filtered].sort(
				(a, b) => (usageCounts[b.id] || 0) - (usageCounts[a.id] || 0),
			);
		}
		return filtered;
	}, [allCategories, transaction.type, usageCounts]);

	useEffect(() => {
		setTransaction(clone(propTransaction));
		setAmountDisplay(String(propTransaction.amount || ""));
		setConfirmingDelete(false);
	}, [propTransaction]);

	const updateField = (field: string, value: string | number | boolean) => {
		setTransaction((prev) => ({ ...prev, [field]: value }));
	};

	const handleOk = () => {
		setIsLoading(true);
		DataBaseClient.Transaction.update(transaction)
			.then(() => {
				openNotificationWithIcon(
					"success",
					"Success",
					`Transaction ${transaction.description} updated`,
				);
				useTransactionStore.getState().updateTransaction(transaction);
				onOpenChange(false);
			})
			.catch((err) => console.error(err))
			.finally(() => setIsLoading(false));
	};

	const handleDelete = () => {
		setIsLoading(true);
		DataBaseClient.Transaction.delete(propTransaction.id)
			.then(() => {
				openNotificationWithIcon("success", "Success", "Transaction deleted");
				removeTransaction(propTransaction);
				onOpenChange(false);
			})
			.catch((err) => {
				console.error(err);
				openNotificationWithIcon(
					"error",
					"Error",
					"Failed to delete transaction",
				);
			})
			.finally(() => {
				setIsLoading(false);
				setConfirmingDelete(false);
			});
	};

	const isDisabled =
		!transaction.amount ||
		!transaction.date ||
		!transaction.category ||
		equals(transaction, propTransaction);
	const isExpense = transaction.type === "expense";
	const accentColor = isExpense ? "#cf1322" : "#3f8600";
	const hasChanges = !equals(transaction, propTransaction);

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="p-0 gap-0 max-w-[360px] rounded-2xl border-0 shadow-2xl overflow-visible"
				aria-describedby={undefined}
			>
				<DialogTitle className="sr-only">Edit {transaction.type}</DialogTitle>
				{/* Colored header strip */}
				<div
					className="px-5 pt-5 pb-4 rounded-t-2xl"
					style={{
						background: `linear-gradient(135deg, ${accentColor}12, ${accentColor}06)`,
					}}
				>
					<div className="flex items-center gap-2 mb-3">
						<div
							className="h-2 w-2 rounded-full"
							style={{ backgroundColor: accentColor }}
						/>
						<span
							className="text-xs font-semibold uppercase tracking-widest"
							style={{ color: accentColor }}
						>
							Edit {transaction.type}
						</span>
						{hasChanges && (
							<span className="ml-auto mr-6 text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
								Modified
							</span>
						)}
					</div>
					{/* Hero amount field */}
					<div className="flex items-baseline gap-1 justify-center">
						<input
							type="text"
							inputMode="decimal"
							value={amountDisplay}
							onChange={(e) => {
								const raw = e.target.value.replace(",", ".");
								if (raw === "" || /^\d*\.?\d*$/.test(raw)) {
									setAmountDisplay(e.target.value);
									updateField("amount", raw === "" ? 0 : parseFloat(raw));
								}
							}}
							placeholder="0.00"
							className="bg-transparent border-none outline-none text-center text-4xl font-bold tracking-tight w-full placeholder:text-black/15"
							style={{ color: accentColor }}
						/>
						<Euro
							className="h-6 w-6 shrink-0 -ml-2 opacity-40"
							style={{ color: accentColor }}
						/>
					</div>
				</div>

				{/* Form fields */}
				<div className="px-5 py-4 space-y-3">
					<div className="space-y-1.5">
						<Label className="text-xs text-muted-foreground flex items-center gap-1.5">
							<FolderOpen className="h-3 w-3" /> Category
						</Label>
						<Select
							value={transaction.category}
							onValueChange={(v) => updateField("category", v)}
						>
							<SelectTrigger className="h-10 bg-white/80 border-black/8 rounded-xl text-sm">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{categories.map((c) => (
									<SelectItem key={c.id} value={c.id}>
										<span
											className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold text-white"
											style={{ backgroundColor: c.color || "#ababab" }}
										>
											{c.name}
										</span>
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="space-y-1.5">
						<div className="flex items-center justify-between">
							<Label className="text-xs text-muted-foreground flex items-center gap-1.5">
								<CalendarDays className="h-3 w-3 shrink-0" /> Date
							</Label>
							<TagChip
								value={transaction.tag || ""}
								tags={tags}
								onChange={(v) => updateField("tag", v)}
							/>
						</div>
						<Input
							type="date"
							value={transaction.date}
							onChange={(e) => updateField("date", e.target.value)}
							className="h-10 bg-white/80 border-black/8 rounded-xl text-sm pr-3 [&::-webkit-calendar-picker-indicator]:hidden"
						/>
					</div>

					<div className="space-y-1.5">
						<Label className="text-xs text-muted-foreground flex items-center gap-1.5">
							<FileText className="h-3 w-3" /> Description
						</Label>
						<Input
							type="text"
							value={transaction.description}
							onChange={(e) => updateField("description", e.target.value)}
							placeholder="Optional"
							className="h-10 bg-white/80 border-black/8 rounded-xl text-sm placeholder:text-muted-foreground/50"
						/>
					</div>
				</div>

				{/* Actions */}
				<div className="px-5 pb-5 flex flex-col gap-2">
					<button
						type="button"
						onClick={handleOk}
						disabled={isDisabled}
						className="w-full h-11 rounded-xl font-semibold text-sm text-white transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed shadow-lg"
						style={{
							backgroundColor: isDisabled ? "#9ca3af" : accentColor,
							boxShadow: isDisabled ? "none" : `0 4px 14px ${accentColor}40`,
						}}
					>
						Save changes
					</button>

					{/* Delete: two-step confirmation */}
					{!confirmingDelete ? (
						<button
							type="button"
							onClick={() => setConfirmingDelete(true)}
							className="w-full h-9 rounded-xl text-sm text-muted-foreground/60 hover:text-destructive flex items-center justify-center gap-1.5 transition-colors"
						>
							<Trash2 className="h-3.5 w-3.5" />
							Delete
						</button>
					) : (
						<div className="flex flex-col gap-1.5 animate-in fade-in slide-in-from-top-1 duration-200">
							<p className="text-xs text-center text-destructive font-medium">
								This will permanently delete this transaction.
							</p>
							<div className="flex gap-2">
								<button
									type="button"
									onClick={() => setConfirmingDelete(false)}
									className="flex-1 h-9 rounded-xl text-sm font-medium border border-black/10 text-muted-foreground hover:text-foreground transition-colors"
								>
									Keep it
								</button>
								<button
									type="button"
									onClick={handleDelete}
									className="flex-1 h-9 rounded-xl text-sm font-semibold bg-destructive text-white hover:bg-destructive/90 active:scale-[0.98] transition-all shadow-sm"
								>
									Yes, delete
								</button>
							</div>
						</div>
					)}
				</div>
			</DialogContent>
		</Dialog>
	);
}
