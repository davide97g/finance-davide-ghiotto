import { useEffect, useMemo, useState } from "react";
import type { CategoryType } from "../../models/category";
import { useCategoryStore } from "../../stores/category";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import type { Filters } from "./TransactionList";

interface Props {
	type: CategoryType;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	filters: Filters;
	onApply: (filters: Filters) => void;
}

export default function FiltersPopup({
	type,
	open,
	onOpenChange,
	filters: propFilters,
	onApply,
}: Props) {
	const [categoryIds, setCategoryIds] = useState<string[]>(
		propFilters.categoryIds || [],
	);
	const allCategories = useCategoryStore((s) => s.categories);
	const categories = useMemo(
		() => allCategories.filter((c) => c.type === type),
		[allCategories, type],
	);

	useEffect(() => {
		setCategoryIds(propFilters.categoryIds || []);
	}, [propFilters]);

	const toggleCategory = (id: string) => {
		setCategoryIds((prev) =>
			prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id],
		);
	};

	const handleOk = () => onApply({ categoryIds });
	const clearFilters = () => onApply({});

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent
				className="max-w-[340px] rounded-2xl border-0 shadow-2xl p-0 gap-0 overflow-hidden"
				aria-describedby={undefined}
			>
				<DialogHeader className="px-5 pt-5 pb-3">
					<DialogTitle className="text-base">Filter by category</DialogTitle>
				</DialogHeader>
				<div className="px-5 pb-4 flex flex-wrap gap-2">
					{categories.map((c) => {
						const isActive = categoryIds.includes(c.id);
						return (
							<button
								type="button"
								key={c.id}
								onClick={() => toggleCategory(c.id)}
								className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 active:scale-95"
								style={{
									backgroundColor: isActive
										? c.color || "#ababab"
										: `${c.color || "#ababab"}18`,
									color: isActive ? "white" : c.color || "#ababab",
									boxShadow: isActive
										? `0 2px 8px ${c.color || "#ababab"}40`
										: "none",
								}}
							>
								{c.name}
							</button>
						);
					})}
				</div>
				<div className="px-5 pb-5 flex gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={clearFilters}
						disabled={!categoryIds.length}
						className="flex-1 rounded-xl h-9 text-xs"
					>
						Clear
					</Button>
					<Button
						size="sm"
						onClick={handleOk}
						className="flex-1 rounded-xl h-9 text-xs"
					>
						Apply{categoryIds.length > 0 ? ` (${categoryIds.length})` : ""}
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}
