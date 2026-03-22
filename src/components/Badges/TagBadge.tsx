import { X } from 'lucide-react';
import { Badge } from '../ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from '../ui/alert-dialog';
import { Tag } from '../../models/tag';
import { DataBaseClient } from '../../api/db';
import { setIsLoading, openNotificationWithIcon } from '../../services/utils';
import { useTagStore } from '../../stores/tag';

interface Props {
	tag: Tag;
	removable?: boolean;
}

export default function TagBadge({ tag, removable }: Props) {
	const deleteTag = () => {
		setIsLoading(true);
		DataBaseClient.Tag.delete(tag.id)
			.then(() => {
				useTagStore.getState().removeTag(tag);
				openNotificationWithIcon('success', 'Deleted', `Successfully deleted ${tag.name}`);
			})
			.catch(err => {
				console.error(err);
				openNotificationWithIcon('error', 'Error', `There was an error deleting ${tag.name}`);
			})
			.finally(() => setIsLoading(false));
	};

	const badge = (
		<Badge
			style={{ backgroundColor: tag.color, color: 'white', cursor: 'pointer' }}
			className="gap-1"
		>
			{tag.name.toUpperCase()}
			{removable && <X className="h-3 w-3" />}
		</Badge>
	);

	if (removable) {
		return (
			<TooltipProvider>
				<Tooltip>
					{tag.description && <TooltipContent>{tag.description}</TooltipContent>}
					<AlertDialog>
						<TooltipTrigger asChild>
							<AlertDialogTrigger asChild>{badge}</AlertDialogTrigger>
						</TooltipTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Delete {tag.name}?</AlertDialogTitle>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>No</AlertDialogCancel>
								<AlertDialogAction onClick={deleteTag}>Yes</AlertDialogAction>
							</AlertDialogFooter>
						</AlertDialogContent>
					</AlertDialog>
				</Tooltip>
			</TooltipProvider>
		);
	}

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>{badge}</TooltipTrigger>
				{tag.description && <TooltipContent>{tag.description}</TooltipContent>}
			</Tooltip>
		</TooltipProvider>
	);
}
