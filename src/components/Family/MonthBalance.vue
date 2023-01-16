<template>
	<a-row>
		<a-col :span="8">
			<a-statistic
				title="Balance"
				:value="totalSumEarnings + totalSumExpenses"
				:precision="0"
				suffix="€"
				:value-style="{
					color: totalSumEarnings > -totalSumExpenses ? '#3f8600' : '#cf1322',
				}"
			/>
		</a-col>
		<a-col :span="8">
			<a-statistic
				title="Tot Earnings"
				:value="totalSumEarnings"
				:precision="0"
				suffix="€"
				:value-style="{ color: '#3f8600' }"
			/>
		</a-col>
		<a-col :span="8">
			<a-statistic
				title="Tot Expenses"
				:value="totalSumExpenses"
				:precision="0"
				suffix="€"
				:value-style="{ color: '#cf1322' }"
			/>
		</a-col>
	</a-row>
	<a-tabs v-model:activeKey="activeKey">
		<a-tab-pane key="1" tab="Expenses">
			<TransactionList :type="'expense'" :title="'Expenses'" :transactions="expenses" />
		</a-tab-pane>
		<a-tab-pane key="2" tab="Earnings">
			<TransactionList :type="'earning'" :title="'Earnings'" :transactions="earnings" />
		</a-tab-pane>
		<a-tab-pane
			key="3"
			tab="Stats"
			tabPosition="right"
			v-if="earnings.length || expenses.length"
		>
			<MonthStats
				:month="props.month"
				:year="props.year"
				:earnings="earnings"
				:expenses="expenses"
			/>
		</a-tab-pane>
	</a-tabs>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { DataBaseClient } from '../../api/db';
import { setIsLoading } from '../../services/utils';
import { useTransactionStore } from '../../stores/transaction';
import MonthStats from './MonthStats.vue';

const props = defineProps<{
	month: string;
	year: string;
}>();

const getTransactions = async () => {
	setIsLoading(true);
	await DataBaseClient.Transaction.get({ month: props.month, year: props.year }).then(results =>
		useTransactionStore().setTransactions(results)
	);
	setIsLoading(false);
};

// stats

const totalSumExpenses = computed(() => {
	let tot = 0;
	expenses.value.forEach(t => (tot += t.amount));
	return -tot;
});
const totalSumEarnings = computed(() => {
	let tot = 0;
	earnings.value.forEach(t => (tot += t.amount));
	return tot;
});
// *** transaction list
const activeKey = ref('1');

const earnings = computed(() =>
	useTransactionStore().earnings.filter(t => t.month === props.month && t.year === props.year)
);
const expenses = computed(() =>
	useTransactionStore().expenses.filter(t => t.month === props.month && t.year === props.year)
);

getTransactions();
</script>
