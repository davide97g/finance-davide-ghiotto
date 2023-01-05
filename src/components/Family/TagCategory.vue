<template>
	<a-tooltip>
		<template #title v-if="category.description">{{ category.description }}</template>
		<a-tag
			:color="category.color"
			size="large"
			closable
			@close="emits('remove')"
			v-if="removable"
			>{{ category.name }}</a-tag
		>
		<a-tag :color="category.color" size="large" v-else>{{ category.name }}</a-tag>
	</a-tooltip>
</template>

<script setup lang="ts">
import { ICategory } from '../../models/category';
defineProps<{
	category: ICategory;
	removable?: boolean;
}>();

const emits = defineEmits(['remove']);
</script>
