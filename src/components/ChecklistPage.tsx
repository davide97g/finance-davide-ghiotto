import { ChevronDown, Plus, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "../lib/utils";
import Avatar from "./Avatar";
import { Checkbox } from "./ui/checkbox";
import { Input } from "./ui/input";

interface ChecklistItem {
	id: string;
	label: string;
	checked: boolean;
}

interface ChecklistPageProps {
	title: string;
	icon: string;
	items: ChecklistItem[];
	filterWhileTyping?: boolean;
	onAdd: (label: string) => Promise<unknown>;
	onCheck: (item: ChecklistItem) => void;
	onDelete: (item: ChecklistItem) => void;
}

export default function ChecklistPage({
	title,
	icon,
	items,
	filterWhileTyping = false,
	onAdd,
	onCheck,
	onDelete,
}: ChecklistPageProps) {
	const [newItem, setNewItem] = useState("");
	const [showCompleted, setShowCompleted] = useState(true);
	const [deletingIds, setDeletingIds] = useState<Set<string>>(new Set());
	const [isCompact, setIsCompact] = useState(false);
	const scrollRef = useRef<HTMLDivElement>(null);

	const handleScroll = useCallback(() => {
		const el = scrollRef.current;
		if (el) {
			setIsCompact(el.scrollTop > 30);
		}
	}, []);

	useEffect(() => {
		const el = scrollRef.current;
		if (el) {
			el.addEventListener("scroll", handleScroll, { passive: true });
			return () => el.removeEventListener("scroll", handleScroll);
		}
	}, [handleScroll]);

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
			onAdd(value);
		}
	};

	const handleDelete = (item: ChecklistItem) => {
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
	const radius = isCompact ? 12 : 28;
	const circumference = 2 * Math.PI * radius;
	const strokeDashoffset = circumference - (progress / 100) * circumference;
	const svgSize = isCompact ? 32 : 76;
	const svgCenter = svgSize / 2;
	const strokeWidth = isCompact ? 3 : 5;

	return (
		<div className="h-screen flex flex-col">
			{/* Sticky header + input */}
			<div className="shrink-0 sticky top-0 z-10 bg-[#eaefea] transition-all duration-300">
				{/* Header */}
				<div
					className={cn(
						"relative px-5 transition-all duration-300",
						isCompact ? "pt-3 pb-2" : "pt-4 pb-4",
					)}
				>
					{!isCompact && <Avatar position="topLeft" />}

					{/* Expanded header */}
					<div
						className={cn(
							"flex flex-col items-center pt-2 gap-3 transition-all duration-300",
							isCompact && "hidden",
						)}
					>
						<div className="relative">
							<svg
								width={svgSize}
								height={svgSize}
								className="transform -rotate-90"
							>
								<circle
									cx={svgCenter}
									cy={svgCenter}
									r={28}
									fill="none"
									stroke="rgba(0,0,0,0.06)"
									strokeWidth="5"
								/>
								<circle
									cx={svgCenter}
									cy={svgCenter}
									r={28}
									fill="none"
									stroke="#3f8600"
									strokeWidth="5"
									strokeLinecap="round"
									strokeDasharray={2 * Math.PI * 28}
									strokeDashoffset={
										2 * Math.PI * 28 - (progress / 100) * 2 * Math.PI * 28
									}
									className="transition-all duration-700 ease-out"
								/>
							</svg>
							<span className="absolute inset-0 flex items-center justify-center text-2xl">
								{icon}
							</span>
						</div>

						<div className="text-center">
							<h1 className="text-xl font-bold tracking-tight text-foreground">
								{title}
							</h1>
							<p className="text-xs text-foreground/50 font-medium mt-0.5">
								{completedCount}/{totalCount} completed
							</p>
						</div>
					</div>

					{/* Compact header */}
					<div
						className={cn(
							"flex items-center gap-3 transition-all duration-300",
							!isCompact && "hidden",
						)}
					>
						<Avatar position="topLeft" size="small" />
						<div className="relative shrink-0 ml-8">
							<svg width={32} height={32} className="transform -rotate-90">
								<circle
									cx={16}
									cy={16}
									r={12}
									fill="none"
									stroke="rgba(0,0,0,0.06)"
									strokeWidth="3"
								/>
								<circle
									cx={16}
									cy={16}
									r={12}
									fill="none"
									stroke="#3f8600"
									strokeWidth="3"
									strokeLinecap="round"
									strokeDasharray={2 * Math.PI * 12}
									strokeDashoffset={
										2 * Math.PI * 12 - (progress / 100) * 2 * Math.PI * 12
									}
									className="transition-all duration-700 ease-out"
								/>
							</svg>
							<span className="absolute inset-0 flex items-center justify-center text-xs">
								{icon}
							</span>
						</div>
						<div className="flex items-baseline gap-2 min-w-0">
							<h1 className="text-base font-bold tracking-tight text-foreground truncate">
								{title}
							</h1>
							<p className="text-[11px] text-foreground/40 font-medium whitespace-nowrap">
								{completedCount}/{totalCount}
							</p>
						</div>
					</div>
				</div>

				{/* Search/Add input */}
				<div
					className={cn(
						"px-5 transition-all duration-300",
						isCompact ? "pb-2.5" : "pb-4",
					)}
				>
					<div
						className={cn(
							"flex items-center gap-2 bg-white/70 backdrop-blur-sm rounded-xl px-3 shadow-sm border border-black/[0.04] transition-all duration-300",
							isCompact ? "py-1" : "py-1.5",
						)}
					>
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
							onClick={handleAdd}
							disabled={!newItem.trim()}
							className={cn(
								"shrink-0 h-7 w-7 rounded-lg flex items-center justify-center transition-all duration-200",
								newItem.trim()
									? "bg-[#3f8600] text-white shadow-sm hover:bg-[#357200] active:scale-95"
									: "bg-black/[0.04] text-foreground/20",
							)}
						>
							<Plus className="h-3.5 w-3.5" />
						</button>
					</div>
				</div>
			</div>

			{/* Scrollable list */}
			<div ref={scrollRef} className="flex-1 overflow-y-auto pb-8">
				{/* Pending items */}
				<div className="px-5">
					{pending.length > 0 && (
						<div className="flex flex-col gap-1.5">
							{pending.map((item, index) => (
								<div
									key={item.id}
									className={cn(
										"group flex items-center gap-3 bg-white/60 backdrop-blur-sm rounded-xl px-3.5 py-3 shadow-sm border border-black/[0.03] transition-all duration-250",
										deletingIds.has(item.id) &&
											"opacity-0 translate-x-8 scale-95",
									)}
									style={{
										animation: "fadeSlideIn 0.3s ease-out both",
										animationDelay: `${index * 30}ms`,
									}}
								>
									<Checkbox
										checked={false}
										onCheckedChange={() => onCheck(item)}
										className="h-5 w-5 rounded-full border-2 border-foreground/15 data-[state=checked]:bg-[#3f8600] data-[state=checked]:border-[#3f8600] transition-colors"
									/>
									<span className="flex-1 text-sm text-foreground/80 text-left leading-snug">
										{item.label}
									</span>
									<button
										onClick={() => handleDelete(item)}
										className="opacity-40 sm:opacity-0 sm:group-hover:opacity-100 active:opacity-100 shrink-0 h-6 w-6 rounded-lg flex items-center justify-center text-foreground/20 hover:text-red-500 hover:bg-red-50 transition-all duration-150"
									>
										<Trash2 className="h-3.5 w-3.5" />
									</button>
								</div>
							))}
						</div>
					)}

					{pending.length === 0 && completedCount > 0 && (
						<div
							className="text-center py-8 text-foreground/30 text-sm"
							style={{ animation: "fadeSlideIn 0.4s ease-out both" }}
						>
							All done! Nothing left to do.
						</div>
					)}

					{totalCount === 0 && (
						<div
							className="text-center py-8 text-foreground/30 text-sm"
							style={{ animation: "fadeSlideIn 0.4s ease-out both" }}
						>
							No items yet. Add one above.
						</div>
					)}
				</div>

				{/* Completed section */}
				{completed.length > 0 && (
					<div className="px-5 mt-5">
						<button
							onClick={() => setShowCompleted(!showCompleted)}
							className="flex items-center gap-2 mb-2 group"
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
								{completed.map((item, index) => (
									<div
										key={item.id}
										className={cn(
											"group flex items-center gap-3 rounded-xl px-3.5 py-2.5 transition-all duration-250",
											deletingIds.has(item.id) &&
												"opacity-0 translate-x-8 scale-95",
										)}
										style={{
											animation: "fadeSlideIn 0.25s ease-out both",
											animationDelay: `${index * 20}ms`,
										}}
									>
										<Checkbox
											checked={true}
											onCheckedChange={() => onCheck(item)}
											className="h-5 w-5 rounded-full border-2 data-[state=checked]:bg-[#3f8600]/60 data-[state=checked]:border-[#3f8600]/60 transition-colors"
										/>
										<span className="flex-1 text-sm text-foreground/30 text-left line-through decoration-foreground/15 leading-snug">
											{item.label}
										</span>
										<button
											onClick={() => handleDelete(item)}
											className="opacity-30 sm:opacity-0 sm:group-hover:opacity-100 active:opacity-100 shrink-0 h-6 w-6 rounded-lg flex items-center justify-center text-foreground/15 hover:text-red-500 hover:bg-red-50 transition-all duration-150"
										>
											<Trash2 className="h-3.5 w-3.5" />
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
