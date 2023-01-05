<template>
	<a-drawer v-model:visible="visible" title="Settings" placement="right">
		<h4>Categories</h4>
		<a-button type="primary" @click="newCategoryPopupIsVisibile = true"> Add New </a-button>
		<div style="margin-top: 30px">
			<p>Expenses</p>
			<TagCategory
				:removable="true"
				:category="category"
				v-for="category in categories.filter(c => c.type == 'expense')"
				@remove="deleteCategory(category)"
			/>
			<p>Earnings</p>
			<TagCategory
				:removable="true"
				:category="category"
				v-for="category in categories.filter(c => c.type == 'earning')"
				@remove="deleteCategory(category)"
			/>
		</div>
		<NewCategoryPopup
			:visible="newCategoryPopupIsVisibile"
			@close="newCategoryPopupIsVisibile = false"
		/>
		<a-divider />
	</a-drawer>
</template>

<script setup lang="ts">
import { watch, ref, computed } from 'vue';
import { Category } from '../../models/category';
import { useCategoryStore } from '../../stores/category';
import NewCategoryPopup from './NewCategoryPopup.vue';
import TagCategory from './TagCategory.vue';

const props = defineProps<{
	visible: boolean;
}>();
const emits = defineEmits(['close']);

const visible = ref(props.visible);
const newCategoryPopupIsVisibile = ref(false);

const categories = computed(() => useCategoryStore().categories);

watch(
	() => props.visible,
	() => (visible.value = props.visible)
);
watch(
	() => visible.value,
	() => {
		if (!visible.value) emits('close');
	}
);

const deleteCategory = (category: Category) => {
	console.info(category);
};
</script>
