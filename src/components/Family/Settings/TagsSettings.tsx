import { useState } from "react";
import type { Tag } from "../../../models/tag";
import { useTagStore } from "../../../stores/tag";
import TagBadge from "../../Badges/TagBadge";
import { Button } from "../../ui/button";
import { Separator } from "../../ui/separator";
import NewTagPopup from "./NewTagPopup";
import UpdateTagPopup from "./UpdateTagPopup";

export default function TagsSettings() {
	const [newTagPopupVisible, setNewTagPopupVisible] = useState(false);
	const [updateTagPopupVisible, setUpdateTagPopupVisible] = useState(false);
	const [selectedTag, setSelectedTag] = useState<Tag | undefined>();
	const tags = useTagStore((s) => s.tags);

	const onTagSelected = (tag: Tag) => {
		setSelectedTag(tag);
		setUpdateTagPopupVisible(true);
	};

	return (
		<div className="text-left">
			<h4 className="font-semibold mb-2">Tags</h4>
			<Button onClick={() => setNewTagPopupVisible(true)}>Add New</Button>
			<NewTagPopup
				open={newTagPopupVisible}
				onOpenChange={setNewTagPopupVisible}
			/>
			<Separator className="my-4" />
			{selectedTag && (
				<UpdateTagPopup
					open={updateTagPopupVisible}
					onOpenChange={setUpdateTagPopupVisible}
					tag={selectedTag}
				/>
			)}
			<div className="inline-flex flex-wrap gap-2.5 max-h-[300px] overflow-auto">
				{tags.map((tag) => (
					// biome-ignore lint/a11y/useSemanticElements: wrapper div with role="button" preserves styling
					<div
						key={tag.id}
						role="button"
						tabIndex={0}
						onClick={() => onTagSelected(tag)}
						onKeyDown={(e) => {
							if (e.key === "Enter" || e.key === " ") {
								e.preventDefault();
								onTagSelected(tag);
							}
						}}
					>
						<TagBadge tag={tag} removable />
					</div>
				))}
			</div>
			<Separator className="my-4" />
		</div>
	);
}
