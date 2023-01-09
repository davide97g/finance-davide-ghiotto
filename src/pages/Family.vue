<template>
	<Avatar :position="'topLeft'" />
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
	<a-tabs id="tabs" v-model:activeKey="activeKey" style="padding: 20px">
		<a-tab-pane key="1" tab="Expenses">
			<TransactionList
				:type="'expense'"
				:title="'Expenses'"
				:transactions="expenses"
				v-if="expenses.length"
			/>
		</a-tab-pane>
		<a-tab-pane key="2" tab="Earnings">
			<TransactionList
				:type="'earning'"
				:title="'Earnings'"
				:transactions="earnings"
				v-if="earnings.length"
			/>
		</a-tab-pane>
		<a-tab-pane key="3" tab="Stats" tabPosition="right">
			<p>Coming soon</p>
		</a-tab-pane>
	</a-tabs>
	<NewTransactionPopup
		:visible="newTransactionPopupIsVisibile"
		:type="type"
		@close="newTransactionPopupIsVisibile = false"
	/>

	<SettingOutlined @click="sideMenuVisible = true" id="icon-open-settings" />
	<Settings :visible="sideMenuVisible" @close="sideMenuVisible = false" />
</template>

<script setup lang="ts">
import { SettingOutlined } from '@ant-design/icons-vue/lib/icons';
import { computed, ref } from 'vue';
import { DataBaseClient } from '../api/db';
import Avatar from '../components/Avatar.vue';
import NewTransactionPopup from '../components/Family/NewTransactionPopup.vue';
import Settings from '../components/Family/Settings.vue';
import TransactionList from '../components/Family/TransactionList.vue';
import { setIsLoading } from '../services/utils';
import { useCategoryStore } from '../stores/category';
import { useTransactionStore } from '../stores/transaction';

const getData = async () => {
	setIsLoading(true);
	await DataBaseClient.Transaction.getTransactions().then(results =>
		useTransactionStore().setTransactions(results)
	);
	await DataBaseClient.Category.getAll().then(results =>
		useCategoryStore().setCategories(results)
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

const earnings = computed(() => useTransactionStore().earnings);
const expenses = computed(() => useTransactionStore().expenses);

// *** add new transaction popup

const newTransactionPopupIsVisibile = ref(false);
const type = ref<'expense' | 'earning'>('earning');

const openPopupFor = (_type: 'expense' | 'earning') => {
	type.value = _type;
	newTransactionPopupIsVisibile.value = true;
};

// *** side menu

const sideMenuVisible = ref<boolean>(false);

getData();
</script>

<style scoped lang="scss">
.actions {
	margin-top: 10px;
	width: 100vw;
	display: flex;
	justify-content: space-around;
	align-items: center;
}
#icon-open-settings {
	position: absolute;
	top: 10px;
	right: 10px;
	height: 25px;
	width: 25px;
}
#tabs {
	padding: 20px;
	height: calc(100vh - 235px);
}
</style>
