import { useState } from "react";
import { DataBaseClient } from "../../../api/db";
import type { ITag } from "../../../models/tag";
import {
	openNotificationWithIcon,
	setIsLoading,
} from "../../../services/utils";
import { useTagStore } from "../../../stores/tag";
import { Badge } from "../../ui/badge";
import { Button } from "../../ui/button";
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
}

export default function NewTagPopup({ open, onOpenChange }: Props) {
	const newTag = (): ITag => ({
		name: "",
		description: undefined,
		color: "#ababab",
	});
	const [tag, setTag] = useState<ITag>(newTag());
	const updateField = (field: string, value: string | number | boolean) =>
		setTag((prev) => ({ ...prev, [field]: value }));

	const handleOk = () => {
		setIsLoading(true);
		DataBaseClient.Tag.create(tag)
			.then((t) => {
				openNotificationWithIcon("success", "Success", `Tag ${t.name} created`);
				useTagStore.getState().addTag(t);
				setTag(newTag());
				onOpenChange(false);
			})
			.catch((err) => console.error(err))
			.finally(() => setIsLoading(false));
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent aria-describedby={undefined}>
				<DialogHeader>
					<DialogTitle>New Tag</DialogTitle>
				</DialogHeader>
				<div className="flex flex-col gap-3 items-start">
					<div className="w-full">
						<p className="text-sm mb-1">Name</p>
						<Input
							type="text"
							value={tag.name}
							onChange={(e) => updateField("name", e.target.value)}
							placeholder="Ex. ABC23"
							maxLength={5}
						/>
					</div>
					<div className="w-full">
						<p className="text-sm mb-1">Description</p>
						<Input
							type="text"
							value={tag.description || ""}
							onChange={(e) => updateField("description", e.target.value)}
							placeholder="Optional description"
						/>
					</div>
					<div>
						<p className="text-sm mb-1">Color</p>
						<input
							type="color"
							value={tag.color || "#ababab"}
							onChange={(e) => updateField("color", e.target.value)}
							className="h-10 w-10 cursor-pointer"
						/>
					</div>
				</div>
				{tag.name && (
					<>
						<Separator />
						<div className="flex items-center justify-around">
							<p className="text-sm">Preview</p>
							<Badge style={{ backgroundColor: tag.color, color: "white" }}>
								{tag.name}
							</Badge>
						</div>
					</>
				)}
				<DialogFooter>
					<Button variant="outline" onClick={() => onOpenChange(false)}>
						Cancel
					</Button>
					<Button onClick={handleOk} disabled={!tag.name}>
						Create
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
