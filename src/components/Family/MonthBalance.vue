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
	<a-tabs v-model:activeKey="activeKey" style="position: relative">
		<a-tab-pane key="1" tab="Expenses">
			<TransactionList :type="'expense'" :title="'Expenses'" :transactions="expenses" />
		</a-tab-pane>
		<a-tab-pane key="2" tab="Earnings">
			<TransactionList :type="'earning'" :title="'Earnings'" :transactions="earnings" />
		</a-tab-pane>
		<span class="stats-icon" v-if="earnings.length || expenses.length">
			<LineChartOutlined style="cursor: pointer" @click="statsPopupVisible = true" />
		</span>
	</a-tabs>
	<MonthStatsPopup
		:month="props.month"
		:year="props.year"
		:earnings="earnings"
		:expenses="expenses"
		:visible="statsPopupVisible"
		@close="statsPopupVisible = false"
	/>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { DataBaseClient } from '../../api/db';
import { setIsLoading } from '../../services/utils';
import { useTransactionStore } from '../../stores/transaction';
import { useCategoryStore } from '../../stores/category';
import { LineChartOutlined } from '@ant-design/icons-vue';
import MonthStatsPopup from './MonthStatsPopup.vue';
import { Transaction } from '../../models/transaction';

const props = defineProps<{
	month: string;
	year: string;
}>();

const statsPopupVisible = ref(false);

const getTransactions = async () => {
	setIsLoading(true);

	await DataBaseClient.Transaction.getRT(
		(transactions: Transaction[]) => useTransactionStore().setTransactions(transactions),
		{
			month: props.month,
			year: props.year,
		}
	);
	setIsLoading(false);
};

const categories = computed(() =>
	useCategoryStore().categories.filter(c => c.type === 'earning' || c.type === 'expense')
);
const getCategory = (categoryId: string) => categories.value.find(c => c.id === categoryId);

// stats

const totalSumExpenses = computed(() => {
	let tot = 0;
	expenses.value
		.filter(t => !getCategory(t.category)?.excludeFromBudget)
		.forEach(t => (tot += t.amount));
	return -tot;
});
const totalSumEarnings = computed(() => {
	let tot = 0;
	earnings.value
		.filter(t => !getCategory(t.category)?.excludeFromBudget)
		.forEach(t => (tot += t.amount));
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

<style scoped lang="scss">
.stats-icon {
	position: absolute;
	right: 0;
	top: 0;
	padding: 10px;
}
</style>
