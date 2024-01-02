<template>
	<Avatar :position="'topLeft'" />
	<h1>Family</h1>
	<a-tabs
		v-model:activeKey="activeYear"
		style="padding: 10px; height: calc(100vh - 100px); position: relative"
	>
		<a-tab-pane :key="year" :tab="year" v-for="year in YEARS">
			<a-tabs v-model:activeKey="activeMonth">
				<a-tab-pane :key="month" :tab="month" v-for="month in MONTHS">
					<MonthBalance :month="month" :year="year" />
				</a-tab-pane>
			</a-tabs>
		</a-tab-pane>
		<span class="stats-icon">
			<LineChartOutlined style="cursor: pointer" @click="openPopupForYearlyStats" />
		</span>
	</a-tabs>
	<div class="flex-center" style="justify-content: space-around">
		<a-button
			type="primary"
			danger
			@click="openPopupFor('expense')"
			style="background: #cf1322; border-color: #cf1322"
			><PlusOutlined /> Exp</a-button
		>
		<a-button
			type="primary"
			success
			@click="openPopupFor('earning')"
			style="background: #3f8600; border-color: #3f8600; margin-left: 5px"
			><PlusOutlined /> Earn</a-button
		>
	</div>
	<NewTransactionPopup
		:visible="newTransactionPopupIsVisibile"
		:type="type"
		@close="newTransactionPopupIsVisibile = false"
	/>
	<YearStatsPopup
		:year="activeYear"
		:earnings="yearlyEarnings"
		:expenses="yearlyExpenses"
		:visible="yearStatsPopupVisible"
		@close="yearStatsPopupVisible = false"
		@freeze="freezeYear"
	/>
	<SettingOutlined @click="sideMenuVisible = true" id="icon-open-settings" />
	<Settings :visible="sideMenuVisible" @close="sideMenuVisible = false" />
</template>

<script setup lang="ts">
import { SettingOutlined, PlusOutlined, LineChartOutlined } from '@ant-design/icons-vue/lib/icons';
import { ComputedRef, computed, ref } from 'vue';
import { DataBaseClient } from '../api/db';
import Avatar from '../components/Avatar.vue';
import NewTransactionPopup from '../components/Family/NewTransactionPopup.vue';
import YearStatsPopup from '../components/Family/YearStatsPopup.vue';
import Settings from '../components/Family/Settings/Settings.vue';
import { MONTHS, YEARS, setIsLoading } from '../services/utils';
import { useCategoryStore } from '../stores/category';
import { useStatsStore } from '../stores/stats';
import { IStats } from '../models/stats';
import { Transaction } from '../models/transaction';
import { useTagStore } from '../stores/tag';

const activeMonth = ref(MONTHS[new Date().getMonth()]);
const activeYear = ref(new Date().getFullYear().toString());

const getCategories = async () => {
	setIsLoading(true);
	await DataBaseClient.Category.get().then(results => useCategoryStore().setCategories(results));
	setIsLoading(false);
};

const getTags = async () => {
	setIsLoading(true);
	await DataBaseClient.Tag.get().then(results => useTagStore().setTags(results));
	setIsLoading(false);
};

const categories = computed(() =>
	useCategoryStore().categories.filter(c => c.type === 'earning' || c.type === 'expense')
);

const includedCategoriesIds = computed(() =>
	categories.value.filter(c => !c.excludeFromBudget).map(c => c.id)
);

// *** add new transaction popup

const newTransactionPopupIsVisibile = ref(false);
const type = ref<'expense' | 'earning'>('earning');

const openPopupFor = (_type: 'expense' | 'earning') => {
	type.value = _type;
	newTransactionPopupIsVisibile.value = true;
};

// *** stats popup
const yearStatsPopupVisible = ref(false);
const yearlyEarnings: ComputedRef<IStats[]> = computed(() => {
	return useStatsStore().stats.filter(s => s.type === 'earning' && s.year === activeYear.value);
});
const yearlyExpenses: ComputedRef<IStats[]> = computed(() => {
	return useStatsStore().stats.filter(s => s.type === 'expense' && s.year === activeYear.value);
});
const openPopupForYearlyStats = async () => {
	yearStatsPopupVisible.value = true;
	setIsLoading(true);
	await DataBaseClient.Stats.getByYear(activeYear.value).then(results =>
		useStatsStore().setStats(results)
	);
	setIsLoading(false);
};

// *** freeze year

const getMonthSummaryByCategory = (transactions: Transaction[]) => {
	const categories = [...new Set(transactions.map(t => t.category))];
	const summary = categories.map(category => {
		const categoryTransactions = transactions.filter(t => t.category === category);
		const categoryTransactionsSum = categoryTransactions.reduce(
			(acc, curr) => acc + curr.amount,
			0
		);
		return {
			categoryId: category,
			total: categoryTransactionsSum,
		};
	});
	return summary;
};

const freezeYear = async () => {
	const year = activeYear.value;
	setIsLoading(true);
	try {
		// get transaction for all the year
		const yearTransactions: Transaction[] = await DataBaseClient.Transaction.get({
			year,
		});

		const yearStats: IStats[] = [];

		const months = [...new Set(yearTransactions.map(t => t.month))];

		months
			.sort((a, b) => {
				const aDate = new Date(`1 ${a}`);
				const bDate = new Date(`1 ${b}`);
				return aDate.getTime() - bDate.getTime();
			})
			.forEach(month => {
				const monthTransactions = yearTransactions
					.filter(t => t.month === month)
					.filter(t => includedCategoriesIds.value.includes(t.category));
				const monthEarnings = monthTransactions.filter(t => t.type === 'earning');
				const monthExpenses = monthTransactions.filter(t => t.type === 'expense');
				const monthEarningsSum = monthEarnings.reduce((acc, curr) => acc + curr.amount, 0);
				const monthExpensesSum = monthExpenses.reduce((acc, curr) => acc + curr.amount, 0);
				const monthEarningsSummary = getMonthSummaryByCategory(monthEarnings);
				const monthExpensesSummary = getMonthSummaryByCategory(monthExpenses);
				yearStats.push({
					month,
					year,
					type: 'earning',
					total: monthEarningsSum,
					categorySummary: monthEarningsSummary,
					lastUpdate: new Date().toDateString(),
				});
				yearStats.push({
					month,
					year,
					type: 'expense',
					categorySummary: monthExpensesSummary,
					total: monthExpensesSum,
					lastUpdate: new Date().toDateString(),
				});
			});
		if (useStatsStore().stats.length)
			await DataBaseClient.Stats.bulkDelete(useStatsStore().stats.map(s => s.id));
		await DataBaseClient.Stats.bulkAdd(yearStats);
		useStatsStore().reset();
	} catch (e) {
		console.log(e);
	} finally {
		setIsLoading(false);
	}
};

// *** side menu

const sideMenuVisible = ref<boolean>(false);

getCategories();
getTags();
</script>

<style scoped lang="scss">
#icon-open-settings {
	position: absolute;
	top: 10px;
	right: 10px;
	height: 25px;
	width: 25px;
}
.stats-icon {
	position: absolute;
	top: 20px;
	right: 10px;
	height: 25px;
	width: 25px;
	padding: 10px;
	display: flex;
	align-items: center;
}
</style>
