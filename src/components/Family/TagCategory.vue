<template>
	<a-tooltip>
		<template #title v-if="category.description">{{ category.description }}</template>
		<a-popconfirm
			:title="'Delete ' + category.name + '?'"
			:visible="removeConfirmVisibile"
			:loading="loading"
			ok-text="Yes"
			cancel-text="No"
			@confirm="deleteCategory(category)"
			@cancel="removeConfirmVisibile = false"
		>
			<a-tag
				:color="category.color"
				:closable="removable"
				@close.prevent="removeConfirmVisibile = true"
				>{{ category.name.toLowerCase() }}</a-tag
			>
		</a-popconfirm>
	</a-tooltip>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { DataBaseClient } from '../../api/db';
import { Category } from '../../models/category';
import { setIsLoading, loading, openNotificationWithIcon } from '../../services/utils';
import { useCategoryStore } from '../../stores/category';
defineProps<{
	category: Category;
	removable?: boolean;
}>();

const removeConfirmVisibile = ref(false);

const deleteCategory = (category: Category) => {
	setIsLoading(true);
	DataBaseClient.Category.deleteCategory(category.id)
		.then(() => {
			useCategoryStore().removeCategory(category);
			openNotificationWithIcon('success', 'Deleted', `Successfully deleted ${category.name}`);
		})
		.catch(err => {
			console.error(err);
			openNotificationWithIcon(
				'error',
				'Error',
				`There was an error deleting ${category.name}`
			);
		})
		.finally(() => setIsLoading(false));
};
</script>
