import {
	CalendarDays,
	Euro,
	FileText,
	FolderOpen,
	Tag as TagIcon,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { DataBaseClient } from "../../api/db";
import type { ITransaction } from "../../models/transaction";
import {
	formatDate,
	MONTHS,
	openNotificationWithIcon,
	setIsLoading,
} from "../../services/utils";
import { useCategoryStore } from "../../stores/category";
import { useCategoryUsageStore } from "../../stores/categoryUsage";
import { useTagStore } from "../../stores/tag";
import { Dialog, DialogContent } from "../ui/dialog";
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
	type: "expense" | "earning";
}

export default function NewTransactionPopup({
	open,
	onOpenChange,
	type,
}: Props) {
	const newTransaction = (): Partial<ITransaction> => ({
		description: "",
		date: formatDate(new Date().toISOString()),
		category: "",
		type,
		month: MONTHS[new Date().getMonth()],
		year: new Date().getFullYear().toString(),
		tag: "XB0kK9DnZIIEsPKsaWEB",
	});

	const [transaction, setTransaction] = useState<Partial<ITransaction>>(
		newTransaction(),
	);
	const [amountDisplay, setAmountDisplay] = useState("");
	const allCategories = useCategoryStore((s) => s.categories);
	const usageCounts = useCategoryUsageStore((s) => s.counts);
	const tags = useTagStore((s) => s.tags);
	const categories = useMemo(() => {
		const filtered = allCategories.filter((c) => c.type === type);
		if (type === "expense") {
			return [...filtered].sort(
				(a, b) => (usageCounts[b.id] || 0) - (usageCounts[a.id] || 0),
			);
		}
		return filtered;
	}, [allCategories, type, usageCounts]);

	// biome-ignore lint/correctness/useExhaustiveDependencies: newTransaction is intentionally excluded to avoid infinite re-renders
	useEffect(() => {
		setTransaction(newTransaction());
		setAmountDisplay("");
	}, [open, type]);

	const updateField = (field: string, value: string | number) => {
		setTransaction((prev) => {
			const updated = { ...prev, [field]: value };
			if (field === "date" && value) {
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
			.then((t) => {
				openNotificationWithIcon(
					"success",
					"Success",
					`Transaction ${t.description} saved`,
				);
				setTransaction(newTransaction());
				setAmountDisplay("");
				onOpenChange(false);
			})
			.catch((err) => console.error(err))
			.finally(() => setIsLoading(false));
	};

	const isDisabled =
		!transaction.amount || !transaction.date || !transaction.category;
	const isExpense = type === "expense";
	const accentColor = isExpense ? "#cf1322" : "#3f8600";

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="p-0 gap-0 overflow-hidden max-w-[360px] rounded-2xl border-0 shadow-2xl">
				{/* Colored header strip */}
				<div
					className="px-5 pt-5 pb-4"
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
							New {type}
						</span>
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
							className="bg-transparent border-none outline-none text-center text-4xl font-bold tracking-tight w-full placeholder:text-foreground/15"
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
							value={transaction.category || ""}
							onValueChange={(v) => updateField("category", v)}
						>
							<SelectTrigger className="h-10 bg-card/80 border-border/50 rounded-xl text-sm">
								<SelectValue placeholder="Select category" />
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

					<div className="grid grid-cols-2 gap-3">
						<div className="space-y-1.5">
							<Label className="text-xs text-muted-foreground flex items-center gap-1.5">
								<CalendarDays className="h-3 w-3" /> Date
							</Label>
							<Input
								type="date"
								value={transaction.date || ""}
								onChange={(e) => updateField("date", e.target.value)}
								className="h-10 bg-card/80 border-border/50 rounded-xl text-sm"
							/>
						</div>
						<div className="space-y-1.5">
							<Label className="text-xs text-muted-foreground flex items-center gap-1.5">
								<TagIcon className="h-3 w-3" /> Tag
							</Label>
							<Select
								value={transaction.tag || ""}
								onValueChange={(v) => updateField("tag", v)}
							>
								<SelectTrigger className="h-10 bg-card/80 border-border/50 rounded-xl text-sm">
									<SelectValue placeholder="Tag" />
								</SelectTrigger>
								<SelectContent>
									{tags.map((t) => (
										<SelectItem key={t.id} value={t.id}>
											{t.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					</div>

					<div className="space-y-1.5">
						<Label className="text-xs text-muted-foreground flex items-center gap-1.5">
							<FileText className="h-3 w-3" /> Description
						</Label>
						<Input
							type="text"
							value={transaction.description || ""}
							onChange={(e) => updateField("description", e.target.value)}
							placeholder="Optional"
							className="h-10 bg-card/80 border-border/50 rounded-xl text-sm placeholder:text-muted-foreground/50"
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
						Create {type}
					</button>
					<button
						type="button"
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
