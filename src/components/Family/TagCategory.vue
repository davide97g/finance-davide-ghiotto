<template>
	<a-tooltip>
		<template #title v-if="category.description">{{ category.description }}</template>
		<a-tag :color="category.color" size="large">{{ category.name }}</a-tag>
	</a-tooltip>
</template>

<script setup lang="ts">
import { ICategory } from '../../models/category';

const props = defineProps<{
	category: ICategory;
}>();
</script>
