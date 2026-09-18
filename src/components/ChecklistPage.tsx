import { Check, ChevronDown, Plus, Search, Trash2, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { ChecklistItemView } from "../hooks/useChecklist";
import { cn } from "../lib/utils";
import Avatar from "./Avatar";
import { Input } from "./ui/input";

interface ChecklistPageProps {
	title: string;
	icon: string;
	items: ChecklistItemView[];
	filterWhileTyping?: boolean;
	error?: string | null;
	onDismissError?: () => void;
	onAdd: (label: string) => Promise<unknown>;
	onCheck: (item: ChecklistItemView) => void;
	onDelete: (item: ChecklistItemView) => void;
}

/**
 * Tap targets are sized for a hand holding a basket, not a mouse: the whole
 * row toggles, `touch-manipulation` drops the browser's double-tap delay, and
 * the press feedback is local CSS so it shows before any network answer.
 */
const ROW_TAP =
	"flex flex-1 min-w-0 items-center gap-3 rounded-xl px-3.5 text-left cursor-pointer touch-manipulation select-none transition-colors duration-100 active:bg-foreground/[0.06] [-webkit-tap-highlight-color:transparent]";

const DELETE_TAP =
	"shrink-0 h-11 w-11 rounded-xl flex items-center justify-center touch-manipulation transition-all duration-150 [-webkit-tap-highlight-color:transparent]";

export default function ChecklistPage({
	title,
	icon,
	items,
	filterWhileTyping = false,
	error,
	onDismissError,
	onAdd,
	onCheck,
	onDelete,
}: ChecklistPageProps) {
	const [newItem, setNewItem] = useState("");
	const [showCompleted, setShowCompleted] = useState(true);
	const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());

	const pending = useMemo(() => {
		let filtered = items.filter((i) => !i.checked);
		if (filterWhileTyping && newItem) {
			filtered = filtered.filter((i) =>
				i.label.toLowerCase().includes(newItem.toLowerCase()),
			);
		}
		return filtered.sort((a, b) => a.label.localeCompare(b.label));
	}, [items, filterWhileTyping, newItem]);

	const completed = useMemo(() => {
		let filtered = items.filter((i) => i.checked);
		if (filterWhileTyping && newItem) {
			filtered = filtered.filter((i) =>
				i.label.toLowerCase().includes(newItem.toLowerCase()),
			);
		}
		return filtered.sort((a, b) => a.label.localeCompare(b.label));
	}, [items, filterWhileTyping, newItem]);

	const totalCount = items.length;
	const completedCount = items.filter((i) => i.checked).length;
	const progress = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

	const handleAdd = () => {
		if (newItem.trim()) {
			const value = newItem.trim();
			setNewItem("");
			onAdd(value).catch(() => {
				// The caller rolls the row back and reports it; nothing to do here.
			});
		}
	};

	const handleCheck = (item: ChecklistItemView) => {
		// A short buzz confirms the tap without looking at the screen. Not every
		// browser has it, and it is a nicety either way.
		navigator.vibrate?.(10);
		onCheck(item);
	};

	const handleDelete = (item: ChecklistItemView) => {
		setDeletingIds((prev) => new Set(prev).add(item.id));
		setTimeout(() => {
			onDelete(item);
			setDeletingIds((prev) => {
				const next = new Set(prev);
				next.delete(item.id);
				return next;
			});
		}, 250);
	};

	// SVG circle progress
	const radius = 20;
	const circumference = 2 * Math.PI * radius;
	const strokeDashoffset = circumference - (progress / 100) * circumference;
	const svgSize = 52;
	const svgCenter = svgSize / 2;

	return (
		<div className="h-screen flex flex-col">
			{/* Sticky header + input */}
			<div className="shrink-0 sticky top-0 z-10 bg-background">
				{/* Header */}
				<div className="relative px-5 pt-3 pb-2">
					<Avatar position="topLeft" size="small" />

					<div className="flex items-center gap-3 pl-14">
						<div className="relative shrink-0">
							<svg
								width={svgSize}
								height={svgSize}
								className="transform -rotate-90"
								aria-hidden="true"
							>
								<circle
									cx={svgCenter}
									cy={svgCenter}
									r={radius}
									fill="none"
									className="stroke-foreground/[0.06]"
									strokeWidth="4"
								/>
								<circle
									cx={svgCenter}
									cy={svgCenter}
									r={radius}
									fill="none"
									className="stroke-earning"
									strokeWidth="4"
									strokeLinecap="round"
									strokeDasharray={circumference}
									strokeDashoffset={strokeDashoffset}
									style={{ transition: "stroke-dashoffset 250ms ease-out" }}
								/>
							</svg>
							<span className="absolute inset-0 flex items-center justify-center text-lg">
								{icon}
							</span>
						</div>

						<div className="min-w-0">
							<h1 className="text-lg font-bold tracking-tight text-foreground truncate">
								{title}
							</h1>
							<p className="text-xs text-foreground/50 font-medium">
								{completedCount}/{totalCount} completed
							</p>
						</div>
					</div>
				</div>

				{/* Search/Add input */}
				<div className="px-5 pb-3">
					<div className="flex items-center gap-2 bg-card/70 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-sm border border-border/30">
						{filterWhileTyping ? (
							<Search className="h-4 w-4 text-foreground/30 shrink-0" />
						) : (
							<Plus className="h-4 w-4 text-foreground/30 shrink-0" />
						)}
						<Input
							value={newItem}
							onChange={(e) => setNewItem(e.target.value)}
							placeholder={
								filterWhileTyping ? "Search or add new..." : "Add a new item..."
							}
							onKeyDown={(e) => e.key === "Enter" && handleAdd()}
							className="border-0 bg-transparent shadow-none focus-visible:ring-0 px-0 h-9 text-sm placeholder:text-foreground/30"
						/>
						<button
							type="button"
							onClick={handleAdd}
							disabled={!newItem.trim()}
							aria-label="Add item"
							className={cn(
								"shrink-0 h-9 w-9 rounded-lg flex items-center justify-center touch-manipulation transition-all duration-200",
								newItem.trim()
									? "bg-earning text-white shadow-sm hover:bg-earning/90 active:scale-95"
									: "bg-foreground/[0.04] text-foreground/20",
							)}
						>
							<Plus className="h-4 w-4" />
						</button>
					</div>
				</div>

				{error && (
					<div className="px-5 pb-2">
						<div className="flex items-center gap-2 rounded-xl bg-expense/10 border border-expense/20 px-3 py-2">
							<span className="flex-1 text-xs text-expense">{error}</span>
							<button
								type="button"
								onClick={onDismissError}
								aria-label="Dismiss"
								className="shrink-0 h-7 w-7 rounded-lg flex items-center justify-center text-expense/60 touch-manipulation"
							>
								<X className="h-3.5 w-3.5" />
							</button>
						</div>
					</div>
				)}
			</div>

			{/* Scrollable list */}
			<div className="flex-1 overflow-y-auto pb-8">
				{/* Pending items */}
				<div className="px-5">
					{pending.length > 0 && (
						<div className="flex flex-col gap-1.5">
							{pending.map((item) => (
								<div
									key={item.id}
									className={cn(
										"group flex items-center bg-card/60 backdrop-blur-sm rounded-xl pr-1 shadow-sm border border-border/30 transition-opacity duration-250",
										deletingIds.has(item.id) && "opacity-0",
										item.unsaved && "opacity-60",
									)}
								>
									<label className={cn(ROW_TAP, "min-h-[52px] py-3")}>
										<input
											type="checkbox"
											checked={false}
											onChange={() => handleCheck(item)}
											className="sr-only peer"
										/>
										<span
											aria-hidden="true"
											className="shrink-0 h-6 w-6 rounded-full border-2 border-foreground/20 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-earning peer-focus-visible:ring-offset-2"
										/>
										<span className="flex-1 text-sm text-foreground/80 leading-snug">
											{item.label}
										</span>
									</label>
									<button
										type="button"
										onClick={() => handleDelete(item)}
										aria-label={`Delete ${item.label}`}
										className={cn(
											DELETE_TAP,
											"opacity-40 sm:opacity-0 sm:group-hover:opacity-100 active:opacity-100 text-foreground/25 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50",
										)}
									>
										<Trash2 className="h-4 w-4" />
									</button>
								</div>
							))}
						</div>
					)}

					{pending.length === 0 && completedCount > 0 && (
						<div className="text-center py-8 text-foreground/30 text-sm">
							All done! Nothing left to do.
						</div>
					)}

					{totalCount === 0 && (
						<div className="text-center py-8 text-foreground/30 text-sm">
							No items yet. Add one above.
						</div>
					)}
				</div>

				{/* Completed section */}
				{completed.length > 0 && (
					<div className="px-5 mt-5">
						<button
							type="button"
							onClick={() => setShowCompleted(!showCompleted)}
							className="flex items-center gap-2 mb-2 group h-11 touch-manipulation"
						>
							<ChevronDown
								className={cn(
									"h-3.5 w-3.5 text-foreground/30 transition-transform duration-200",
									!showCompleted && "-rotate-90",
								)}
							/>
							<span className="text-xs font-semibold text-foreground/35 uppercase tracking-wider">
								Completed
							</span>
							<span className="text-xs font-medium text-foreground/25 bg-foreground/[0.04] rounded-full px-2 py-0.5">
								{completed.length}
							</span>
						</button>

						{showCompleted && (
							<div className="flex flex-col gap-1">
								{completed.map((item) => (
									<div
										key={item.id}
										className={cn(
											"group flex items-center rounded-xl pr-1 transition-opacity duration-250",
											deletingIds.has(item.id) && "opacity-0",
										)}
									>
										<label className={cn(ROW_TAP, "min-h-[48px] py-2.5")}>
											<input
												type="checkbox"
												checked={true}
												onChange={() => handleCheck(item)}
												className="sr-only peer"
											/>
											<span
												aria-hidden="true"
												className="shrink-0 h-6 w-6 rounded-full bg-earning/60 flex items-center justify-center text-white transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-earning peer-focus-visible:ring-offset-2"
											>
												<Check className="h-3.5 w-3.5" strokeWidth={3} />
											</span>
											<span className="flex-1 text-sm text-foreground/30 line-through decoration-foreground/15 leading-snug">
												{item.label}
											</span>
										</label>
										<button
											type="button"
											onClick={() => handleDelete(item)}
											aria-label={`Delete ${item.label}`}
											className={cn(
												DELETE_TAP,
												"opacity-30 sm:opacity-0 sm:group-hover:opacity-100 active:opacity-100 text-foreground/20 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/50",
											)}
										>
											<Trash2 className="h-4 w-4" />
										</button>
									</div>
								))}
							</div>
						)}
					</div>
				)}
			</div>
		</div>
	);
}
