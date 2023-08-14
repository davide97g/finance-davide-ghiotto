<template>
	<a-tooltip>
		<template #title v-if="tag.description">{{ tag.description }}</template>
		<a-popconfirm
			:title="'Delete ' + tag.shortName + '?'"
			:visible="removeConfirmVisibile"
			:loading="loading"
			ok-text="Yes"
			cancel-text="No"
			@confirm="deleteTag(tag)"
			@cancel="removeConfirmVisibile = false"
		>
			<a-tag
				:color="tag.color"
				:closable="removable"
				@close.prevent="removeConfirmVisibile = true"
				>{{ tag.shortName.toUpperCase() }}</a-tag
			>
		</a-popconfirm>
	</a-tooltip>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { DataBaseClient } from '../../api/db';
import { Tag } from '../../models/tag';
import { setIsLoading, loading, openNotificationWithIcon } from '../../services/utils';
import { useTagStore } from '../../stores/tag';
defineProps<{
	tag: Tag;
	removable?: boolean;
}>();

const removeConfirmVisibile = ref(false);

const deleteTag = (tag: Tag) => {
	setIsLoading(true);
	DataBaseClient.Tag.delete(tag.id)
		.then(() => {
			useTagStore().removeTag(tag);
			openNotificationWithIcon('success', 'Deleted', `Successfully deleted ${tag.name}`);
		})
		.catch(err => {
			console.error(err);
			openNotificationWithIcon('error', 'Error', `There was an error deleting ${tag.name}`);
		})
		.finally(() => setIsLoading(false));
};
</script>
