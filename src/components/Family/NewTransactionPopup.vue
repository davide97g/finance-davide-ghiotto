<template>
	<a-modal
		v-model:visible="visible"
		:title="'New ' + type"
		@cancel="emits('close')"
		:loading="loading"
		:disabled="true"
	>
		<div class="input-form">
			<a-input
				class="full-width"
				type="date"
				v-model:value="transaction.date"
				placeholder="Choose a date"
				style="margin-top: 10px"
			></a-input>
			<a-input
				class="full-width"
				type="text"
				v-model:value="transaction.description"
				placeholder="Enter a description"
				style="margin-top: 10px"
			></a-input>
			<a-input-number
				class="full-width"
				v-model:value="transaction.amount"
				placeholder="Enter an amount"
				:min="0"
				:precision="2"
				style="margin-top: 10px"
			></a-input-number>
			<a-select
				class="full-width"
				ref="select"
				v-model:value="transaction.category"
				v-if="type == 'expense'"
				style="margin-top: 10px"
			>
				<a-select-option
					v-for="category in ExpenseCategories"
					:key="category"
					:value="category"
					>{{ category }}</a-select-option
				>
			</a-select>
			<a-select
				class="full-width"
				ref="select"
				v-model:value="transaction.category"
				v-else
				style="margin-top: 10px"
			>
				<a-select-option
					v-for="category in EarningCategories"
					:key="category"
					:value="category"
					>{{ category }}</a-select-option
				>
			</a-select>
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
import { ref, watch } from 'vue';
import { ITransaction, EarningCategories, ExpenseCategories } from '../../models/transaction';
import { formatDate, loading, setIsLoading } from '../../services/utils';
import { DataBaseClient } from '../../api/db';

const props = defineProps<{
	visible: boolean;
	type: 'expense' | 'earning';
}>();

const emits = defineEmits(['close', 'ok']);

const visible = ref<boolean>(false);
const newTransaction = () => ({
	description: '',
	date: formatDate(new Date().toLocaleDateString()),
	amount: 0,
	category: '',
	type: props.type,
});
const transaction = ref<ITransaction>(newTransaction());
const resetTransaction = () => (transaction.value = newTransaction());

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

const handleOk = () => {
	setIsLoading(true);
	DataBaseClient.Transactions.createNewTransaction(transaction.value)
		.then(() => {
			resetTransaction();
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
</style>
