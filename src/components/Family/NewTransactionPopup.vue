<template>
	<a-modal
		v-model:visible="visible"
		:title="'New ' + type"
		@cancel="emits('close')"
		:loading="loading"
		:disabled="true"
	>
		<div class="input-form">
			<a-row>
				<p>Date</p>
				<a-input
					class="full-width"
					type="date"
					v-model:value="transaction.date"
					placeholder="Choose a date"
				/>
			</a-row>
			<a-row>
				<p>Description</p>
				<a-input
					class="full-width"
					type="text"
					v-model:value="transaction.description"
					placeholder="Enter a description"
				/>
			</a-row>
			<a-row>
				<p>Amount</p>
				<a-input-number
					class="full-width"
					v-model:value="transaction.amount"
					placeholder="Enter an amount"
					:min="0"
					:precision="2"
					addon-after="€"
				/>
			</a-row>
			<a-row class="full-width">
				<p>Category</p>
				<a-select class="full-width" ref="select" v-model:value="transaction.category">
					<a-select-option
						v-for="category in categories"
						:key="category.id"
						:value="category.id"
						>{{ category.name.toLowerCase() }}</a-select-option
					>
				</a-select>
			</a-row>
			<a-row class="full-width">
				<p>Tag</p>
				<a-select class="full-width" ref="select" v-model:value="transaction.tag">
					<a-select-option v-for="tag in tags" :key="tag.id" :value="tag.id">{{
						tag.name
					}}</a-select-option>
				</a-select>
			</a-row>
		</div>
		<template #footer>
			<a-button key="back" @click="emits('close')">Return</a-button>
			<a-button
				key="submit"
				type="primary"
				:loading="loading"
				@click="handleOk"
				:disabled="
					!transaction.amount ||
					!transaction.date ||
					!transaction.description ||
					!transaction.category
				"
				>Create</a-button
			>
		</template>
	</a-modal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { ITransaction } from '../../models/transaction';
import {
	formatDate,
	loading,
	MONTHS,
	openNotificationWithIcon,
	setIsLoading,
} from '../../services/utils';
import { DataBaseClient } from '../../api/db';
import { useCategoryStore } from '../../stores/category';
import { useTagStore } from '../../stores/tag';

const props = defineProps<{
	visible: boolean;
	type: 'expense' | 'earning';
}>();

const emits = defineEmits(['close', 'ok']);

const visible = ref<boolean>(false);
const newTransaction = () => ({
	description: '',
	date: formatDate(new Date().toISOString()),
	category: '',
	type: props.type,
	month: MONTHS[new Date().getMonth()],
	year: new Date().getFullYear().toString(),
	tag: 'XB0kK9DnZIIEsPKsaWEB',
});

const transaction = ref<Partial<ITransaction>>(newTransaction());
const resetTransaction = () => (transaction.value = newTransaction());

watch(
	() => transaction.value.date,
	date => {
		if (date) {
			const dateObj = new Date(date);
			transaction.value.month = MONTHS[dateObj.getMonth()];
			transaction.value.year = dateObj.getFullYear().toString();
		}
	}
);
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
	() => resetTransaction()
);

const allCategories = computed(() => useCategoryStore().categories);
const categories = computed(() => allCategories.value.filter(c => c.type === props.type));
const tags = computed(() => useTagStore().tags);

const handleOk = () => {
	setIsLoading(true);
	const completeTransaction: ITransaction = transaction.value as ITransaction;
	DataBaseClient.Transaction.create(completeTransaction)
		.then(transaction => {
			openNotificationWithIcon(
				'success',
				'Success',
				'Transaction ' + transaction.description + ' saved'
			);
			resetTransaction();
			emits('close');
		})
		.catch(err => console.error(err))
		.finally(() => setIsLoading(false));
};

if (allCategories.value.length === 0) {
	setIsLoading(true);
	DataBaseClient.Category.get()
		.then(categories => {
			useCategoryStore().setCategories(categories);
		})
		.catch(err => console.error(err))
		.finally(() => setIsLoading(false));
}
</script>

<style lang="scss" scoped>
.input-form {
	display: flex;
	flex-direction: column;
	justify-content: flex-start;
	align-items: flex-start;
	gap: 0.75rem;
}
</style>
