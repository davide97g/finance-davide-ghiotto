import { useState } from 'react';
import { Button } from '../../ui/button';
import { Separator } from '../../ui/separator';
import CategoryBadge from '../../Badges/CategoryBadge';
import NewCategoryPopup from './NewCategoryPopup';
import UpdateCategoryPopup from './UpdateCategoryPopup';
import { useCategoryStore } from '../../../stores/category';
import { Category } from '../../../models/category';

export default function CategoriesSettings() {
	const [newCategoryPopupVisible, setNewCategoryPopupVisible] = useState(false);
	const [updateCategoryPopupVisible, setUpdateCategoryPopupVisible] = useState(false);
	const [selectedCategory, setSelectedCategory] = useState<Category | undefined>();
	const categories = useCategoryStore(s => s.categories);

	const onCategorySelected = (category: Category) => {
		setSelectedCategory(category);
		setUpdateCategoryPopupVisible(true);
	};

	return (
		<div className="text-left">
			<h4 className="font-semibold mb-2">Categories</h4>
			<Button onClick={() => setNewCategoryPopupVisible(true)}>Add New</Button>
			<NewCategoryPopup open={newCategoryPopupVisible} onOpenChange={setNewCategoryPopupVisible} />
			<Separator className="my-4" />
			{selectedCategory && (
				<UpdateCategoryPopup open={updateCategoryPopupVisible} onOpenChange={setUpdateCategoryPopupVisible} category={selectedCategory} />
			)}
			<p className="font-medium">Expenses</p>
			<div className="inline-flex flex-wrap gap-2.5 max-h-[300px] overflow-auto">
				{categories.filter(c => c.type === 'expense').map(category => (
					<div key={category.id} onClick={() => onCategorySelected(category)}>
						<CategoryBadge category={category} removable />
					</div>
				))}
			</div>
			<Separator className="my-4" />
			<p className="font-medium">Earnings</p>
			<div className="inline-flex flex-wrap gap-2.5 max-h-[300px] overflow-auto">
				{categories.filter(c => c.type === 'earning').map(category => (
					<div key={category.id} onClick={() => onCategorySelected(category)}>
						<CategoryBadge category={category} removable />
					</div>
				))}
			</div>
			<Separator className="my-4" />
		</div>
	);
}
