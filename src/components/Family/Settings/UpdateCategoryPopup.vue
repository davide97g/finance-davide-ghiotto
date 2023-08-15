<template>
	<a-modal
		v-model:visible="visible"
		title="Modify Category"
		@cancel="emits('close')"
		:loading="loading"
		:disabled="true"
	>
		<div class="input-form center">
			<a-row class="full-width" style="margin-top: 10px">
				<p>Name</p>
				<a-input
					class="full-width"
					type="text"
					v-model:value="category.name"
					placeholder="Category name"
				/>
			</a-row>
			<a-row class="full-width" style="margin-top: 10px">
				<p>Description</p>
				<a-input
					name="description"
					class="full-width"
					type="text"
					v-model:value="category.description"
					placeholder="Optional description"
				/>
			</a-row>
			<a-row class="full-width flex-center" style="margin-top: 10px">
				<a-col :span="10">
					<p>Color</p>
					<a-input
						name="color"
						type="color"
						v-model:value="category.color"
						placeholder="Background color"
					></a-input>
				</a-col>
			</a-row>
		</div>
		<a-divider></a-divider>
		<a-row v-if="props.category">
			<a-col :span="12">
				<div class="category-preview flex-center">
					<p>Previous</p>
					<a-tooltip>
						<template #title v-if="props.category.description">{{
							props.category.description
						}}</template>
						<a-tag :color="props.category.color" size="large">{{
							props.category.name
						}}</a-tag>
					</a-tooltip>
				</div>
			</a-col>
			<a-col :span="12">
				<div class="category-preview flex-center" v-if="category.name">
					<p>Preview</p>
					<a-tooltip>
						<template #title v-if="category.description">{{
							category.description
						}}</template>
						<a-tag :color="category.color" size="large">{{ category.name }}</a-tag>
					</a-tooltip>
				</div>
			</a-col>
			<a-row class="full-width" style="margin-top: 20px">
				<a-col :span="24">
					<a-checkbox v-model:checked="category.excludeFromBudget"
						>Exclude From Budget</a-checkbox
					>
				</a-col>
			</a-row>
		</a-row>
		<template #footer>
			<a-button key="back" @click="emits('close')">Cancel</a-button>
			<a-button
				key="submit"
				type="primary"
				:loading="loading"
				@click="handleOk"
				:disabled="!category.name"
				>Update</a-button
			>
		</template>
	</a-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { Category } from '../../../models/category';
import { loading, openNotificationWithIcon, setIsLoading } from '../../../services/utils';
import { DataBaseClient } from '../../../api/db';
import { useCategoryStore } from '../../../stores/category';

const props = defineProps<{
	visible: boolean;
	category?: Category;
}>();
const emits = defineEmits(['close', 'ok']);

const visible = ref<boolean>(false);
const category = ref<Category>(JSON.parse(JSON.stringify(props.category || {})));

watch(
	() => props.visible,
	() => (visible.value = props.visible)
);
watch(
	() => props.category,
	() => (category.value = JSON.parse(JSON.stringify(props.category || {})))
);
watch(
	() => visible.value,
	() => {
		if (!visible.value) emits('close');
	}
);

const handleOk = () => {
	setIsLoading(true);
	DataBaseClient.Category.update(category.value)
		.then(() => {
			openNotificationWithIcon(
				'success',
				'Success',
				'Category ' + category.value.name + ' updated'
			);
			useCategoryStore().updateCategory(category.value);
			emits('close');
		})
		.catch(err => console.error(err))
		.finally(() => setIsLoading(false));
};
</script>

<style lang="scss" scoped>
.input-form {
	display: flex;
	flex-direction: column;
	justify-content: flex-start;
	align-items: flex-start;
}
.category-preview {
	justify-content: space-around;
	p {
		margin-bottom: 0;
	}
}
</style>
