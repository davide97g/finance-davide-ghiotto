import { useCompactMode } from "../hooks/useCompactMode";
import type { Transaction } from "../models/transaction";
import { formatDate } from "../services/utils";
import { useCategoryStore } from "../stores/category";
import { useTagStore } from "../stores/tag";

interface Props {
	item: Transaction;
}

function getAmountTier(amount: number): "sm" | "md" | "lg" {
	if (amount >= 100) return "lg";
	if (amount >= 20) return "md";
	return "sm";
}

const amountStyles = {
	sm: "text-[14px] font-semibold",
	md: "text-[19px] font-bold",
	lg: "text-[25px] font-extrabold",
} as const;

const emojiRegex = /\p{Emoji_Presentation}|\p{Emoji}\uFE0F/gu;

function extractEmojis(text: string): string {
	return (text.match(emojiRegex) || []).join("");
}

export default function TransactionItem({ item }: Props) {
	const categories = useCategoryStore((s) => s.categories);
	const tags = useTagStore((s) => s.tags);
	const { compactMode } = useCompactMode();

	const category = categories.find((c) => c.id === item.category);
	const tag = tags.find((t) => t.id === item.tag);
	const showTag = tag && item.tag !== "XB0kK9DnZIIEsPKsaWEB";
	const categoryColor = category?.color || "#ababab";
	const tier = getAmountTier(item.amount);
	const categoryEmojis = category ? extractEmojis(category.name) : "";

	return (
		<div
			className="relative flex items-stretch w-full rounded-xl overflow-hidden transition-all duration-150 shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
			style={{
				backgroundColor: `${categoryColor}10`,
				borderTop: `1px solid ${categoryColor}30`,
				borderRight: `1px solid ${categoryColor}30`,
				borderBottom: `1px solid ${categoryColor}30`,
				borderLeft: `${tier === "lg" ? 5 : tier === "md" ? 4 : 3}px solid ${categoryColor}`,
			}}
		>
			{compactMode && categoryEmojis && (
				<span
					className="absolute left-3 top-1/2 -translate-y-1/2 text-[40px] leading-none opacity-[0.15] pointer-events-none select-none"
					aria-hidden="true"
				>
					{categoryEmojis}
				</span>
			)}
			<div
				className={`flex-1 min-w-0 px-3 ${compactMode ? "py-3.5" : "py-2"} flex items-center gap-3 relative z-[1]`}
			>
				{/* Left: info */}
				<div className="flex-1 min-w-0 flex flex-col gap-0.5">
					{!compactMode && (
						<div className="flex items-center gap-2">
							<div
								className="w-2 h-2 rounded-full shrink-0"
								style={{ backgroundColor: categoryColor }}
							/>
							<span className="text-[13px] font-semibold text-foreground/85 truncate capitalize leading-tight">
								{category?.name || "Uncategorized"}
							</span>
							{category?.excludeFromBudget && (
								<span
									className="text-[8px] font-bold px-1 py-px rounded uppercase tracking-widest shrink-0"
									style={{
										backgroundColor: `${categoryColor}20`,
										color: categoryColor,
									}}
								>
									excl
								</span>
							)}
							{showTag && (
								<span
									className="text-[8px] font-bold px-1.5 py-px rounded-full shrink-0 text-white/90 uppercase tracking-wide"
									style={{ backgroundColor: tag.color || "#888" }}
								>
									{tag.name}
								</span>
							)}
						</div>
					)}
					<div
						className={`flex items-center gap-1 ${compactMode ? "pl-10" : "pl-4"}`}
					>
						<span
							className={`text-[10px] font-medium tabular-nums shrink-0 ${compactMode ? "text-foreground/80" : "text-muted-foreground/50"}`}
						>
							{formatDate(item.date, true)}
						</span>
						{item.description && (
							<>
								<span
									className={`text-[10px] ${compactMode ? "text-foreground/30" : "text-muted-foreground/25"}`}
								>
									·
								</span>
								<span
									className={`text-[10px] truncate capitalize ${compactMode ? "text-foreground/70" : "text-muted-foreground/40"}`}
								>
									{item.description}
								</span>
							</>
						)}
						{compactMode && showTag && (
							<span
								className="text-[8px] font-bold px-1.5 py-px rounded-full shrink-0 text-white/90 uppercase tracking-wide"
								style={{ backgroundColor: tag.color || "#888" }}
							>
								{tag.name}
							</span>
						)}
						{compactMode && category?.excludeFromBudget && (
							<span
								className="text-[8px] font-bold px-1 py-px rounded uppercase tracking-widest shrink-0"
								style={{
									backgroundColor: `${categoryColor}20`,
									color: categoryColor,
								}}
							>
								excl
							</span>
						)}
					</div>
				</div>

				{/* Right: scaled amount */}
				<span
					className={`${amountStyles[tier]} tabular-nums tracking-tight leading-none shrink-0`}
					style={{ color: `${categoryColor}cc` }}
				>
					{item.amount}
					<span className="text-[10px] font-medium ml-0.5 opacity-50">€</span>
				</span>
			</div>
		</div>
	);
}
