import { useState, useEffect, useMemo } from 'react';
import { Button } from '../ui/button';
import { Checkbox } from '../ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { useCategoryStore } from '../../stores/category';
import { CategoryType } from '../../models/category';
import { Filters } from './TransactionList';

interface Props {
	type: CategoryType;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	filters: Filters;
	onApply: (filters: Filters) => void;
}

export default function FiltersPopup({ type, open, onOpenChange, filters: propFilters, onApply }: Props) {
	const [categoryIds, setCategoryIds] = useState<string[]>(propFilters.categoryIds || []);
	const allCategories = useCategoryStore(s => s.categories);
	const categories = useMemo(() => allCategories.filter(c => c.type === type), [allCategories, type]);

	useEffect(() => {
		setCategoryIds(propFilters.categoryIds || []);
	}, [propFilters]);

	const toggleCategory = (id: string) => {
		setCategoryIds(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
	};

	const handleOk = () => onApply({ categoryIds });
	const clearFilters = () => onApply({});

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Filters</DialogTitle>
				</DialogHeader>
				<div className="flex flex-col gap-2 items-start">
					<p className="text-sm">Categories to filter</p>
					{categories.map(c => (
						<div key={c.id} className="flex items-center gap-2">
							<Checkbox checked={categoryIds.includes(c.id)} onCheckedChange={() => toggleCategory(c.id)} />
							<span className="text-sm">{c.name}</span>
						</div>
					))}
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
					<Button variant="destructive" onClick={clearFilters} disabled={!categoryIds.length}>Clear</Button>
					<Button onClick={handleOk}>Apply</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
