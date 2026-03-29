import { useState } from "react";
import { DataBaseClient } from "../../../api/db";
import type { ICategory } from "../../../models/category";
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
import { Label } from "../../ui/label";
import { RadioGroup, RadioGroupItem } from "../../ui/radio-group";
import { Separator } from "../../ui/separator";

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export default function NewCategoryPopup({ open, onOpenChange }: Props) {
	const newCategory = (): ICategory => ({
		name: "",
		type: "expense",
		description: undefined,
		color: "#ababab",
	});
	const [category, setCategory] = useState<ICategory>(newCategory());

	const updateField = (field: string, value: string | number | boolean) =>
		setCategory((prev) => ({ ...prev, [field]: value }));

	const handleOk = () => {
		setIsLoading(true);
		DataBaseClient.Category.create(category)
			.then((cat) => {
				openNotificationWithIcon(
					"success",
					"Success",
					`Category ${cat.name} created`,
				);
				useCategoryStore.getState().addCategory(cat);
				setCategory(newCategory());
				onOpenChange(false);
			})
			.catch((err) => console.error(err))
			.finally(() => setIsLoading(false));
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>New Category</DialogTitle>
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
					<div className="flex items-center gap-4 w-full">
						<div>
							<p className="text-sm mb-1">Color</p>
							<input
								type="color"
								value={category.color || "#ababab"}
								onChange={(e) => updateField("color", e.target.value)}
								className="h-10 w-10 cursor-pointer"
							/>
						</div>
						<div>
							<p className="text-sm mb-1">Type</p>
							<RadioGroup
								value={category.type}
								onValueChange={(v) => updateField("type", v)}
								className="flex gap-2"
							>
								<div className="flex items-center gap-1">
									<RadioGroupItem value="expense" id="expense" />
									<Label htmlFor="expense">Expense</Label>
								</div>
								<div className="flex items-center gap-1">
									<RadioGroupItem value="earning" id="earning" />
									<Label htmlFor="earning">Earning</Label>
								</div>
							</RadioGroup>
						</div>
					</div>
					<div className="flex items-center gap-2">
						<Checkbox
							checked={!!category.excludeFromBudget}
							onCheckedChange={(v) => updateField("excludeFromBudget", v)}
						/>
						<span className="text-sm">Exclude From Budget</span>
					</div>
				</div>
				{category.name && (
					<>
						<Separator />
						<div className="flex items-center justify-around">
							<p className="text-sm">Preview</p>
							<Badge
								style={{ backgroundColor: category.color, color: "white" }}
							>
								{category.name}
							</Badge>
						</div>
					</>
				)}
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button onClick={handleOk} disabled={!category.name}>
						Create
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
