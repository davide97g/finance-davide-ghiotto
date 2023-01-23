<template>
	<a-drawer v-model:visible="visible" title="Settings" placement="right">
		<h4>Categories</h4>
		<a-button type="primary" @click="newCategoryPopupIsVisibile = true"> Add New </a-button>
		<NewCategoryPopup
			:visible="newCategoryPopupIsVisibile"
			@close="newCategoryPopupIsVisibile = false"
		/>
		<a-divider />
		<UpdateCategoryPopup
			:visible="updateCategoryPopupIsVisibile"
			:category="selectedCategory"
			@close="updateCategoryPopupIsVisibile = false"
		/>
		<p>Expenses</p>
		<div class="flex-gap" style="max-height: 300px; overflow: auto">
			<TagCategory
				:removable="true"
				:category="category"
				@click="onCategorySelected(category)"
				v-for="category in categories.filter(c => c.type == 'expense')"
			/>
		</div>
		<a-divider />
		<p>Earnings</p>
		<div class="flex-gap" style="max-height: 300px; overflow: auto">
			<TagCategory
				:removable="true"
				:category="category"
				@click="onCategorySelected(category)"
				v-for="category in categories.filter(c => c.type == 'earning')"
			/>
		</div>
		<a-divider />
		<p>Nails</p>
		<div class="flex-gap" style="max-height: 300px; overflow: auto">
			<TagCategory
				:removable="true"
				:category="category"
				@click="onCategorySelected(category)"
				v-for="category in categories.filter(c => c.type == 'nail')"
			/>
		</div>
		<a-divider />
	</a-drawer>
</template>

<script setup lang="ts">
import { watch, ref, computed } from 'vue';
import { Category } from '../../models/category';
import { useCategoryStore } from '../../stores/category';
import NewCategoryPopup from './NewCategoryPopup.vue';
import TagCategory from './TagCategory.vue';
import UpdateCategoryPopup from './UpdateCategoryPopup.vue';

const props = defineProps<{
	visible: boolean;
}>();
const emits = defineEmits(['close']);

const visible = ref(props.visible);
const newCategoryPopupIsVisibile = ref(false);

const categories = computed(() => useCategoryStore().categories);

const updateCategoryPopupIsVisibile = ref(false);
const selectedCategory = ref<Category>();
const onCategorySelected = (category: Category) => {
	selectedCategory.value = category;
	updateCategoryPopupIsVisibile.value = true;
};
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
</script>
