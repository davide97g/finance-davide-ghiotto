<template>
	<a-tabs v-model:activeKey="activeKey">
		<a-tab-pane key="1" tab="Expenses">
			<div style="height: 450px; width: 100%">
				<Doughnut :data="dataExpenses" :options="(options as any)" id="stats-expenses" />
			</div>
		</a-tab-pane>
		<a-tab-pane key="2" tab="Earnings">
			<div style="height: 450px; width: 100%">
				<Doughnut :data="dataEarnings" :options="(options as any)" id="stats-earnings" />
			</div>
		</a-tab-pane>
	</a-tabs>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useCategoryStore } from '../../stores/category';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'vue-chartjs';
import { Category } from '../../models/category';
import { IStats } from '../../models/stats';

ChartJS.register(ArcElement, Tooltip, Legend);

const props = defineProps<{
	expenses: IStats[];
	earnings: IStats[];
}>();

const emits = defineEmits(['close']);

const activeKey = ref('1');
const allCategories = computed(() => useCategoryStore().categories);

interface LegendRow {
	name: string;
	amount: number;
	percentage: number;
	color: string;
}

const legendExpenses = ref([] as LegendRow[]);
const legendEarnings = ref([] as LegendRow[]);

const categories = computed(() =>
	useCategoryStore().categories.filter(c => c.type === 'earning' || c.type === 'expense')
);
const getCategory = (categoryId: string) => categories.value.find(c => c.id === categoryId);

const dataExpenses = computed(() => {
	const categoriesMap: any = {};
	const total = props.expenses.reduce((acc, curr) => acc + curr.total, 0);
	props.expenses.forEach(monthExpenses => {
		monthExpenses.categorySummary.forEach(({ categoryId, total }) => {
			if (!categoriesMap[categoryId]) categoriesMap[categoryId] = 0;
			categoriesMap[categoryId] += total;
		});
	});
	const aggregatedCategory = Object.keys(categoriesMap).map(categoryId => ({
		category: getCategory(categoryId)!,
		amount: categoriesMap[categoryId],
	}));
	aggregatedCategory.sort((a, b) => b.amount - a.amount);
	legendExpenses.value = aggregatedCategory.map(c => ({
		name: c.category.name,
		amount: c.amount,
		percentage: Math.round((c.amount / total) * 100),
		color: c.category.color!,
	}));
	return {
		labels: legendExpenses.value.map(
			c => c.name + ' ' + Math.round((c.amount / total) * 100) + '%'
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
	const total = props.expenses.reduce((acc, curr) => acc + curr.total, 0);
	props.earnings.forEach(monthEarnings => {
		monthEarnings.categorySummary.forEach(({ categoryId, total }) => {
			if (!categoriesMap[categoryId]) categoriesMap[categoryId] = 0;
			categoriesMap[categoryId] += total;
		});
	});
	const aggregatedCategory = Object.keys(categoriesMap).map(categoryId => ({
		category: getCategory(categoryId)!,
		amount: categoriesMap[categoryId],
	}));
	aggregatedCategory.sort((a, b) => b.amount - a.amount);
	legendEarnings.value = aggregatedCategory.map(c => ({
		name: c.category.name,
		amount: c.amount,
		percentage: Math.round((c.amount / total) * 100),
		color: c.category.color!,
	}));
	return {
		labels: legendEarnings.value.map(
			c => c.name + ' ' + Math.round((c.amount / total) * 100) + '%'
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

<style lang="scss" scoped>
.input-form {
	display: flex;
	flex-direction: column;
	justify-content: flex-start;
	align-items: flex-start;
}
</style>
