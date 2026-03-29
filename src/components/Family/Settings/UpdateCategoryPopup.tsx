import { useEffect, useState } from "react";
import { DataBaseClient } from "../../../api/db";
import type { Category } from "../../../models/category";
import {
	openNotificationWithIcon,
	setIsLoading,
} from "../../../services/utils";
import { useCategoryStore } from "../../../stores/category";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
import { Checkbox } from "../../ui/checkbox";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../../ui/dialog";
import { Input } from "../../ui/input";
import { Separator } from "../../ui/separator";

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	category: Category;
}

export default function UpdateCategoryPopup({
	open,
	onOpenChange,
	category: propCategory,
}: Props) {
	const [category, setCategory] = useState<Category>(
		JSON.parse(JSON.stringify(propCategory)),
	);

	useEffect(() => {
		setCategory(JSON.parse(JSON.stringify(propCategory)));
	}, [propCategory]);

	const updateField = (field: string, value: string | number | boolean) =>
		setCategory((prev) => ({ ...prev, [field]: value }));

	const handleOk = () => {
		setIsLoading(true);
		DataBaseClient.Category.update(category)
			.then(() => {
				openNotificationWithIcon(
					"success",
					"Success",
					`Category ${category.name} updated`,
				);
				useCategoryStore.getState().updateCategory(category);
				onOpenChange(false);
			})
			.catch((err) => console.error(err))
			.finally(() => setIsLoading(false));
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Modify Category</DialogTitle>
				</DialogHeader>
				<div className="flex flex-col gap-3 items-start">
					<div className="w-full">
						<p className="text-sm mb-1">Name</p>
						<Input
							type="text"
							value={category.name}
							onChange={(e) => updateField("name", e.target.value)}
							placeholder="Category name"
						/>
					</div>
					<div className="w-full">
						<p className="text-sm mb-1">Description</p>
						<Input
							type="text"
							value={category.description || ""}
							onChange={(e) => updateField("description", e.target.value)}
							placeholder="Optional description"
						/>
					</div>
					<div>
						<p className="text-sm mb-1">Color</p>
						<input
							type="color"
							value={category.color || "#ababab"}
							onChange={(e) => updateField("color", e.target.value)}
							className="h-10 w-10 cursor-pointer"
						/>
					</div>
					<div className="flex items-center gap-2">
						<Checkbox
							checked={!!category.excludeFromBudget}
							onCheckedChange={(v) => updateField("excludeFromBudget", v)}
						/>
						<span className="text-sm">Exclude From Budget</span>
					</div>
				</div>
				<Separator />
				<div className="grid grid-cols-2 gap-4">
					<div className="flex items-center justify-around">
						<p className="text-sm">Previous</p>
						<Badge
							style={{ backgroundColor: propCategory.color, color: "white" }}
						>
							{propCategory.name}
						</Badge>
					</div>
					{category.name && (
						<div className="flex items-center justify-around">
							<p className="text-sm">Preview</p>
							<Badge
								style={{ backgroundColor: category.color, color: "white" }}
							>
								{category.name}
							</Badge>
						</div>
					)}
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button onClick={handleOk} disabled={!category.name}>
						Update
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
