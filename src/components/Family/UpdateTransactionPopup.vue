<template>
	<a-modal
		v-model:visible="visible"
		title="Update Transaction"
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
				style="margin-top: 10px"
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
				key="submit"
				type="primary"
				:loading="loading"
				@click="handleOk"
				:disabled="
					!transaction.amount ||
					!transaction.date ||
					!transaction.description ||
					!transaction.category ||
					equals(transaction, props.transaction)
				"
				>Update</a-button
			>
		</template>
	</a-modal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { Transaction } from '../../models/transaction';
import {
	clone,
	equals,
	loading,
	openNotificationWithIcon,
	setIsLoading,
} from '../../services/utils';
import { DataBaseClient } from '../../api/db';
import { useCategoryStore } from '../../stores/category';
import { useTransactionStore } from '../../stores/transaction';

const props = defineProps<{
	visible: boolean;
	transaction: Transaction;
}>();

const emits = defineEmits(['close']);

const visible = ref<boolean>(false);
const transaction = ref<Transaction>(clone(props.transaction));

watch(
	() => props.visible,
	() => (visible.value = props.visible)
);
watch(
	() => props.transaction,
	() => (transaction.value = clone(props.transaction))
);

watch(
	() => visible.value,
	() => {
		if (!visible.value) emits('close');
	}
);

const categories = computed(() =>
	useCategoryStore().categories.filter(c => c.type === transaction.value.type)
);

const handleOk = () => {
	setIsLoading(true);
	DataBaseClient.Transaction.updateTransaction(transaction.value)
		.then(() => {
			openNotificationWithIcon(
				'success',
				'Success',
				'Transaction ' + transaction.value.description + ' updated'
			);
			useTransactionStore().updateTransaction(transaction.value);
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
