<template>
	<a-tabs v-model:activeKey="activeKey">
		<a-tab-pane key="1" tab="Expenses">
			<div style="height: 400px; width: 100%">
				<Doughnut :data="dataExpenses" :options="(options as any)" id="stats-expenses" />
			</div>
		</a-tab-pane>
		<a-tab-pane key="2" tab="Earnings">
			<div style="height: 400px; width: 100%">
				<Doughnut :data="dataEarnings" :options="(options as any)" id="stats-earnings" />
			</div>
		</a-tab-pane>
	</a-tabs>
</template>

<script setup lang="ts">
import { Transaction } from '../../models/transaction';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'vue-chartjs';
import { computed, ref } from 'vue';
import { useCategoryStore } from '../../stores/category';
import { Category } from '../../models/category';

ChartJS.register(ArcElement, Tooltip, Legend);

const props = defineProps<{
	month: string;
	year: string;
	expenses: Transaction[];
	earnings: Transaction[];
}>();

const activeKey = ref('1');
const allCategories = computed(() => useCategoryStore().categories);

const dataExpenses = computed(() => {
	const categoriesMap: any = {};
	props.expenses.forEach(t => {
		if (!categoriesMap[t.category]) {
			categoriesMap[t.category] = {
				amount: 0,
				category: {} as Category,
			};
		}
		categoriesMap[t.category].amount += t.amount;
	});
	const aggregatedCategory = Object.keys(categoriesMap).map(c => ({
		...categoriesMap[c],
		category: allCategories.value.find(cat => cat.id === c),
	}));
	const total = aggregatedCategory.reduce((acc, c) => acc + c.amount, 0);
	return {
		labels: aggregatedCategory.map(
			c => c.category.name + ' ' + Math.round((c.amount / total) * 100) + '%'
		),
		datasets: [
			{
				backgroundColor: aggregatedCategory.map(c => c.category.color),
				data: aggregatedCategory.map(c => Math.round((c.amount / total) * 100)),
			},
		],
	};
});

const dataEarnings = computed(() => {
	const categoriesMap: any = {};
	props.earnings.forEach(t => {
		if (!categoriesMap[t.category]) {
			categoriesMap[t.category] = {
				amount: 0,
				category: {} as Category,
			};
		}
		categoriesMap[t.category].amount += t.amount;
	});
	const aggregatedCategory = Object.keys(categoriesMap).map(c => ({
		...categoriesMap[c],
		category: allCategories.value.find(cat => cat.id === c),
	}));
	const total = aggregatedCategory.reduce((acc, c) => acc + c.amount, 0);
	return {
		labels: aggregatedCategory.map(
			c => c.category.name + ' ' + Math.round((c.amount / total) * 100) + '%'
		),
		datasets: [
			{
				backgroundColor: aggregatedCategory.map(c => c.category.color),
				data: aggregatedCategory.map(c => Math.round((c.amount / total) * 100)),
			},
		],
	};
});

const options = {
	responsive: true,
	maintainAspectRatio: false,
	plugins: {
		legend: {
			position: 'bottom',
		},
	},
};
</script>
