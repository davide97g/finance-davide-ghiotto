<template>
	<h1>Family</h1>
	<a-row>
		<a-col :span="24">
			<a-statistic
				title="Balance"
				:value="totalSumEarnings + totalSumExpenses"
				:precision="2"
				suffix="€"
				:value-style="{
					color: totalSumEarnings > totalSumExpenses ? '#3f8600' : '#cf1322',
				}"
			/>
		</a-col>
	</a-row>
	<a-row>
		<a-col :span="12">
			<a-statistic
				title="Tot Expenses"
				:value="totalSumExpenses"
				style="margin-right: 50px"
				:precision="2"
				suffix="€"
				:value-style="{ color: '#cf1322' }"
			/>
		</a-col>
		<a-col :span="12">
			<a-statistic
				title="Tot Earnings"
				:value="totalSumEarnings"
				:precision="2"
				suffix="€"
				:value-style="{ color: '#3f8600' }"
			/>
		</a-col>
	</a-row>
	<a-tabs v-model:activeKey="activeKey" style="padding: 20px">
		<a-tab-pane key="1" tab="Expenses">
			<TransactionList :title="'Expenses'" :transactions="expenses" v-if="expenses.length" />
		</a-tab-pane>
		<a-tab-pane key="2" tab="Earnings">
			<TransactionList :title="'Earnings'" :transactions="earnings" v-if="earnings.length" />
		</a-tab-pane>
	</a-tabs>
	<NewTransactionPopup
		:visible="newTransactionPopupIsVisibile"
		:type="type"
		@close="newTransactionPopupIsVisibile = false"
	/>
	<div class="actions">
		<a-button type="primary" danger @click="openPopupFor('expense')">Add Expense</a-button>
		<a-button type="primary" @click="openPopupFor('earning')">Add Earning</a-button>
	</div>
</template>

<script setup lang="ts">
import NewTransactionPopup from '../components/Family/NewTransactionPopup.vue';
import TransactionList from '../components/Family/TransactionList.vue';
import { computed, ref } from 'vue';
import { DataBaseClient, IResult } from '../api/db';
import { ITransaction } from '../models/transaction';

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

const resultsEarnings = ref<IResult<ITransaction>[]>([]);
const resultsExpenses = ref<IResult<ITransaction>[]>([]);

const earnings = computed(() => {
	return resultsEarnings.value.map(r => r.data);
});
const expenses = computed(() => {
	return resultsExpenses.value.map(r => r.data);
});

DataBaseClient.Transactions.getTransactions('earning').then(
	results => (resultsEarnings.value = results)
);
DataBaseClient.Transactions.getTransactions('expense').then(
	results => (resultsExpenses.value = results)
);

// *** add new transaction popup

const newTransactionPopupIsVisibile = ref(false);
const type = ref<'expense' | 'earning'>('earning');

const openPopupFor = (_type: 'expense' | 'earning') => {
	type.value = _type;
	newTransactionPopupIsVisibile.value = true;
};
</script>

<style scoped lang="scss">
.actions {
	position: absolute;
	bottom: 0px;
	height: 75px;
	width: 100vw;
	display: flex;
	justify-content: space-around;
	align-items: center;
}
</style>
