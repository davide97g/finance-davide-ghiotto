import { Transaction } from '../models/transaction';
import { formatDate } from '../services/utils';
import { useCategoryStore } from '../stores/category';
import { useTagStore } from '../stores/tag';

interface Props {
	item: Transaction;
}

function getAmountTier(amount: number): 'sm' | 'md' | 'lg' {
	if (amount >= 100) return 'lg';
	if (amount >= 20) return 'md';
	return 'sm';
}

const amountStyles = {
	sm: 'text-[14px] font-semibold',
	md: 'text-[19px] font-bold',
	lg: 'text-[25px] font-extrabold',
} as const;

export default function TransactionItem({ item }: Props) {
	const categories = useCategoryStore(s => s.categories);
	const tags = useTagStore(s => s.tags);

	const category = categories.find(c => c.id === item.category);
	const tag = tags.find(t => t.id === item.tag);
	const showTag = tag && item.tag !== 'XB0kK9DnZIIEsPKsaWEB';
	const categoryColor = category?.color || '#ababab';
	const tier = getAmountTier(item.amount);

	return (
		<div
			className="flex items-stretch w-full rounded-xl overflow-hidden transition-all duration-150 shadow-[0_1px_3px_rgba(0,0,0,0.08)]"
			style={{
				backgroundColor: `${categoryColor}10`,
				borderTop: `1px solid ${categoryColor}30`,
				borderRight: `1px solid ${categoryColor}30`,
				borderBottom: `1px solid ${categoryColor}30`,
				borderLeft: `${tier === 'lg' ? 5 : tier === 'md' ? 4 : 3}px solid ${categoryColor}`,
			}}
		>
			<div className="flex-1 min-w-0 px-3 py-2 flex items-center gap-3">
				{/* Left: category dot + info */}
				<div className="flex-1 min-w-0 flex flex-col gap-0.5">
					<div className="flex items-center gap-2">
						<div
							className="w-2 h-2 rounded-full shrink-0"
							style={{ backgroundColor: categoryColor }}
						/>
						<span className="text-[13px] font-semibold text-foreground/85 truncate capitalize leading-tight">
							{category?.name || 'Uncategorized'}
						</span>
						{category?.excludeFromBudget && (
							<span
								className="text-[8px] font-bold px-1 py-px rounded uppercase tracking-widest shrink-0"
								style={{ backgroundColor: `${categoryColor}20`, color: categoryColor }}
							>
								excl
							</span>
						)}
						{showTag && (
							<span
								className="text-[8px] font-bold px-1.5 py-px rounded-full shrink-0 text-white/90 uppercase tracking-wide"
								style={{ backgroundColor: tag.color || '#888' }}
							>
								{tag.name}
							</span>
						)}
					</div>
					<div className="flex items-center gap-1 pl-4">
						<span className="text-[10px] text-muted-foreground/50 font-medium tabular-nums shrink-0">
							{formatDate(item.date, true)}
						</span>
						{item.description && (
							<>
								<span className="text-[10px] text-muted-foreground/25">·</span>
								<span className="text-[10px] text-muted-foreground/40 truncate capitalize">
									{item.description}
								</span>
							</>
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
