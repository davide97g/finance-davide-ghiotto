import { useState } from 'react';
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
import { Category } from '../../models/category';
import { DataBaseClient } from '../../api/db';
import { setIsLoading, openNotificationWithIcon } from '../../services/utils';
import { useCategoryStore } from '../../stores/category';

interface Props {
	category: Category;
	removable?: boolean;
}

export default function CategoryBadge({ category, removable }: Props) {
	const deleteCategory = () => {
		setIsLoading(true);
		DataBaseClient.Category.delete(category.id)
			.then(() => {
				useCategoryStore.getState().removeCategory(category);
				openNotificationWithIcon('success', 'Deleted', `Successfully deleted ${category.name}`);
			})
			.catch(err => {
				console.error(err);
				openNotificationWithIcon('error', 'Error', `There was an error deleting ${category.name}`);
			})
			.finally(() => setIsLoading(false));
	};

	const badge = (
		<Badge
			style={{ backgroundColor: category.color, color: 'white', cursor: 'pointer' }}
			className="gap-1"
		>
			{category.name.toLowerCase()}
			{removable && <X className="h-3 w-3" />}
		</Badge>
	);

	if (removable) {
		return (
			<TooltipProvider>
				<Tooltip>
					{category.description && <TooltipContent>{category.description}</TooltipContent>}
					<AlertDialog>
						<TooltipTrigger asChild>
							<AlertDialogTrigger asChild>{badge}</AlertDialogTrigger>
						</TooltipTrigger>
						<AlertDialogContent>
							<AlertDialogHeader>
								<AlertDialogTitle>Delete {category.name}?</AlertDialogTitle>
							</AlertDialogHeader>
							<AlertDialogFooter>
								<AlertDialogCancel>No</AlertDialogCancel>
								<AlertDialogAction onClick={deleteCategory}>Yes</AlertDialogAction>
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
				{category.description && <TooltipContent>{category.description}</TooltipContent>}
			</Tooltip>
		</TooltipProvider>
	);
}
