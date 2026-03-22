import { Sheet, SheetContent, SheetHeader, SheetTitle } from '../../ui/sheet';
import CategoriesSettings from './CategoriesSettings';
import TagsSettings from './TagsSettings';

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
				<CategoriesSettings />
				<TagsSettings />
			</SheetContent>
		</Sheet>
	);
}
