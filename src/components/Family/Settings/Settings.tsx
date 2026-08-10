import { Sheet, SheetContent, SheetHeader, SheetTitle } from "../../ui/sheet";
import CategoriesSettings from "./CategoriesSettings";
import CategoryUsageRefresh from "./CategoryUsageRefresh";
import RecurringSettings from "./RecurringSettings";
import TagsSettings from "./TagsSettings";

interface Props {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export default function Settings({ open, onOpenChange }: Props) {
	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className="overflow-auto">
				<SheetHeader>
					<SheetTitle>Settings</SheetTitle>
				</SheetHeader>
				<RecurringSettings />
				<CategoriesSettings />
				<TagsSettings />
				<CategoryUsageRefresh />
			</SheetContent>
		</Sheet>
	);
}
