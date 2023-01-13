<template>
	<a-modal
		v-model:visible="visible"
		:title="'New ' + type"
		@cancel="emits('close')"
		:loading="loading"
		:disabled="true"
	>
		<div class="input-form">
			<a-row class="full-width" style="flex-direction: column">
				<p>Date</p>
				<a-input
					class="full-width"
					type="date"
					v-model:value="transaction.date"
					placeholder="Choose a date"
				/>
			</a-row>
			<a-row class="full-width" style="margin-top: 10px">
				<p>Description</p>
				<a-input
					class="full-width"
					type="text"
					v-model:value="transaction.description"
					placeholder="Enter a description"
				/>
			</a-row>
			<a-row class="full-width" style="margin-top: 10px">
				<a-col :span="12">
					<p>Amount</p>
					<a-input-number
						class="full-width"
						v-model:value="transaction.amount"
						placeholder="Enter an amount"
						:min="0"
						:precision="2"
					></a-input-number
				></a-col>
				<a-col :span="12">
					<p>Category</p>
					<a-select class="full-width" ref="select" v-model:value="transaction.category">
						<a-select-option
							v-for="category in categories"
							:key="category.id"
							:value="category.id"
							>{{ category.name.toLowerCase() }}</a-select-option
						>
					</a-select>
				</a-col>
			</a-row>
			<div v-if="type === 'expense'" class="full-width">
				<a-divider />
				<a-checkbox
					style="margin-top: 10px"
					v-model:checked="periodic"
					@change="setUpPeriodicity"
					>Periodic</a-checkbox
				>
				<a-row style="margin-top: 10px" v-if="periodic">
					<p>Frequency</p>
					<a-select
						v-if="transaction.periodicity"
						class="full-width"
						v-model:value="transaction.periodicity.frequency"
					>
						<a-select-option
							v-for="frequency in frequencyOptions"
							:key="frequency"
							:value="frequency"
							>{{ frequency }}</a-select-option
						>
					</a-select>
				</a-row>
				<a-divider />
				<a-row style="margin-top: 10px" v-if="periodic">
					<p>Ending type:</p>
					<p style="margin-left: 10px">{{ endWithDate ? 'Date' : 'Repeats' }}</p>
					<a-switch style="margin-left: 10px" v-model:checked="endWithDate" />
				</a-row>
				<a-row style="margin-top: 10px" class="full-width" v-if="periodic">
					<a-col :span="12">
						<p>Ending Date</p>
						<a-input
							v-if="transaction.periodicity && transaction.periodicity.endDate"
							class="full-width"
							type="date"
							v-model:value="transaction.periodicity.endDate"
							:min="transaction.date"
							placeholder="End date"
							:disabled="!endWithDate"
						/>
					</a-col>
					<a-col :span="12" style="padding-left: 10px">
						<p>Repeats</p>
						<a-input-number
							v-if="transaction.periodicity && transaction.periodicity.repeats"
							class="full-width"
							v-model:value="transaction.periodicity.repeats"
							placeholder="How many times it repeats"
							:min="1"
							:disabled="endWithDate"
						></a-input-number>
					</a-col>
				</a-row>
			</div>
			<!-- TODO: add preview total cost -->
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
import { useTransactionStore } from '../../stores/transaction';

const props = defineProps<{
	visible: boolean;
	type: 'expense' | 'earning';
}>();

const emits = defineEmits(['close', 'ok']);

const visible = ref<boolean>(false);
const newTransaction = () => ({
	description: '',
	date: formatDate(new Date().toISOString()),
	amount: 0,
	category: '',
	type: props.type,
	month: MONTHS[new Date().getMonth()],
	year: new Date().getFullYear().toString(),
});

const transaction = ref<ITransaction>(newTransaction());
const resetTransaction = () => (transaction.value = newTransaction());

watch(
	() => transaction.value.date,
	date => {
		const dateObj = new Date(date);
		transaction.value.month = MONTHS[dateObj.getMonth()];
		transaction.value.year = dateObj.getFullYear().toString();
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

const frequencyOptions = ['monthly', 'weekly', 'daily', 'yearly'];
const periodic = ref(false);
const endWithDate = ref(false);
const setUpPeriodicity = () => {
	if (!transaction.value.periodicity) {
		const endingDate = new Date();
		endingDate.setMonth(endingDate.getMonth() + 1);
		transaction.value.periodicity = {
			frequency: 'monthly',
			endDate: formatDate(endingDate.toISOString()),
			startDate: formatDate(new Date().toISOString()),
			repeats: 1,
		};
	}
};

const handleOk = () => {
	setIsLoading(true);
	DataBaseClient.Transaction.create(transaction.value)
		.then(transaction => {
			openNotificationWithIcon(
				'success',
				'Success',
				'Transaction ' + transaction.description + ' saved'
			);
			useTransactionStore().addTransaction(transaction);
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
