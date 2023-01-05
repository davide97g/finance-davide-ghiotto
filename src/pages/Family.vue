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
	<div class="actions">
		<a-button type="primary" danger @click="openPopupFor('expense')">Add Expense</a-button>
		<a-button type="primary" @click="openPopupFor('earning')">Add Earning</a-button>
	</div>
	<a-tabs v-model:activeKey="activeKey" style="padding: 20px">
		<a-tab-pane key="1" tab="Expenses">
			<TransactionList
				:title="'Expenses'"
				:transactions="expenses"
				:categories="categories"
				v-if="expenses.length"
			/>
		</a-tab-pane>
		<a-tab-pane key="2" tab="Earnings">
			<TransactionList
				:title="'Earnings'"
				:transactions="earnings"
				:categories="categories"
				v-if="earnings.length"
			/>
		</a-tab-pane>
	</a-tabs>
	<NewTransactionPopup
		:visible="newTransactionPopupIsVisibile"
		:type="type"
		:categories="categories"
		@close="newTransactionPopupIsVisibile = false"
	/>
	<NewCategoryPopup
		:visible="newCategoryPopupIsVisibile"
		@close="newCategoryPopupIsVisibile = false"
	/>
	<a-button
		type="primary"
		shape="round"
		size="small"
		id="add-new-category"
		@click="newCategoryPopupIsVisibile = true"
	>
		<template #icon>
			<PlusOutlined />
		</template>
		Category
	</a-button>
</template>

<script setup lang="ts">
import NewTransactionPopup from '../components/Family/NewTransactionPopup.vue';
import NewCategoryPopup from '../components/Family/NewCategoryPopup.vue';
import TransactionList from '../components/Family/TransactionList.vue';
import { computed, ref } from 'vue';
import { DataBaseClient, IResult } from '../api/db';
import { ITransaction } from '../models/transaction';
import { PlusOutlined } from '@ant-design/icons-vue/lib/icons';
import { Category } from '../models/category';

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
const categories = ref<Category[]>([]);

const earnings = computed(() => {
	return resultsEarnings.value.map(r => r.data);
});
const expenses = computed(() => {
	return resultsExpenses.value.map(r => r.data);
});

DataBaseClient.Transaction.getTransactions('earning').then(
	results => (resultsEarnings.value = results)
);
DataBaseClient.Transaction.getTransactions('expense').then(
	results => (resultsExpenses.value = results)
);

DataBaseClient.Category.getAll().then(results => (categories.value = results));

// *** add new transaction popup

const newTransactionPopupIsVisibile = ref(false);
const type = ref<'expense' | 'earning'>('earning');

const openPopupFor = (_type: 'expense' | 'earning') => {
	type.value = _type;
	newTransactionPopupIsVisibile.value = true;
};

// *** add new category popup

const newCategoryPopupIsVisibile = ref(false);
</script>

<style scoped lang="scss">
.actions {
	margin-top: 10px;
	width: 100vw;
	display: flex;
	justify-content: space-around;
	align-items: center;
}
#add-new-category {
	position: absolute;
	bottom: 10px;
	right: 10px;
}
</style>
