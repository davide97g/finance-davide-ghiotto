<template>
	<a-modal
		v-model:visible="visible"
		title="New Category"
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
				<a-col :span="14">
					<p>Type</p>
					<a-radio-group v-model:value="category.type">
						<a-radio-button value="expense">Expense</a-radio-button>
						<a-radio-button value="earning">Earning</a-radio-button>
					</a-radio-group>
				</a-col>
			</a-row>
		</div>
		<a-divider></a-divider>
		<div class="category-preview flex-center" v-if="category.name">
			<p>Preview</p>
			<a-tooltip>
				<template #title v-if="category.description">{{ category.description }}</template>
				<a-tag :color="category.color" size="large">{{ category.name }}</a-tag>
			</a-tooltip>
		</div>
		<template #footer>
			<a-button key="back" @click="emits('close')">Cancel</a-button>
			<a-button
				key="submit"
				type="primary"
				:loading="loading"
				@click="handleOk"
				:disabled="!category.name"
				>Create</a-button
			>
		</template>
	</a-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { ICategory } from '../../models/category';
import { loading, openNotificationWithIcon, setIsLoading } from '../../services/utils';
import { DataBaseClient } from '../../api/db';

const props = defineProps<{
	visible: boolean;
}>();

const emits = defineEmits(['close', 'ok']);

const visible = ref<boolean>(false);
const newCategory = (): ICategory => ({
	name: '',
	type: 'expense',
	description: undefined,
	color: '#ababab',
});
const category = ref<ICategory>(newCategory());
const resetCategory = () => (category.value = newCategory());

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

const handleOk = () => {
	setIsLoading(true);
	DataBaseClient.Category.createNewCategory(category.value)
		.then(() => {
			openNotificationWithIcon(
				'success',
				'Success',
				'Category ' + category.value.name + ' created'
			);
			resetCategory();
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
