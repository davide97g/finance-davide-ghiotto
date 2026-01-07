import { DataBaseClient } from '../api/db';
import type { Category } from '../models/category';
import type { Tag } from '../models/tag';
import { useCategoryStore } from '../stores/category';
import { useTagStore } from '../stores/tag';

const downloadJSON = (data: unknown, filename: string) => {
	const json = JSON.stringify(data, null, 2);
	const blob = new Blob([json], { type: 'application/json' });
	const url = URL.createObjectURL(blob);
	const link = document.createElement('a');
	link.href = url;
	link.download = filename;
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
};

export const exportCategories = (): void => {
	const categoryStore = useCategoryStore();
	const categories: Category[] = categoryStore.categories;
	downloadJSON(categories, 'categories-export.json');
};

export const exportTags = (): void => {
	const tagStore = useTagStore();
	const tags: Tag[] = tagStore.tags;
	downloadJSON(tags, 'tags-export.json');
};

export const exportTransactions = (): void => {
	DataBaseClient.Transaction.get().then(transactions => {
		downloadJSON(transactions, 'transactions-export.json');
	});
};
