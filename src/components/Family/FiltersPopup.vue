<template>
	<a-modal
		v-model:visible="visible"
		title="Filters"
		@cancel="emits('close')"
		:loading="loading"
		:disabled="true"
	>
		<div class="input-form">
			<p>Categories to filter</p>
			<a-select
				class="full-width"
				ref="select"
				v-model:value="filters.categoryIds"
				style="margin-top: 10px"
				:mode="'multiple'"
			>
				<a-select-option
					v-for="category in categories"
					:key="category.id"
					:value="category.id"
					>{{ category.name }}</a-select-option
				>
			</a-select>
		</div>
		<template #footer>
			<a-button key="back" @click="emits('close')">Cancel</a-button>
			<a-button
				type="primary"
				danger
				@click="clearFilters"
				:disabled="!filters.categoryIds?.length"
				>Clear</a-button
			>
			<a-button key="submit" type="primary" :loading="loading" @click="handleOk"
				>Apply</a-button
			>
		</template>
	</a-modal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { loading } from '../../services/utils';
import { useCategoryStore } from '../../stores/category';
import { CategoryType } from '../../models/category';
import { Filters } from './TransactionList.vue';

const props = defineProps<{
	type: CategoryType;
	visible: boolean;
	filters?: Filters;
}>();

const emits = defineEmits(['close', 'ok']);

const visible = ref<boolean>(false);
const filters = ref<Filters>(JSON.parse(JSON.stringify(props.filters)));
const category = ref('');

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

watch(
	() => props.type,
	() => (category.value = '')
);

watch(
	() => props.filters,
	() => {
		if (props.filters) filters.value = JSON.parse(JSON.stringify(props.filters));
	}
);

const allCategories = computed(() => useCategoryStore().categories);
const categories = computed(() => allCategories.value.filter(c => c.type === props.type));

const clearFilters = () => {
	filters.value = {};
	handleOk();
};
const handleOk = () => emits('ok', filters.value);
</script>

<style lang="scss" scoped>
.input-form {
	display: flex;
	flex-direction: column;
	justify-content: flex-start;
	align-items: flex-start;
}
</style>
