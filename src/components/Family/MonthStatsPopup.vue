<template>
	<a-modal
		v-model:visible="visible"
		:title="'Statistic for ' + month + ' ' + year"
		@cancel="emits('close')"
		:disabled="true"
	>
		<a-tabs v-model:activeKey="activeKey">
			<a-tab-pane key="1" tab="Expenses">
				<div style="height: 450px; width: 100%">
					<Doughnut
						:data="dataExpenses"
						:options="(options as any)"
						id="stats-expenses"
					/>
				</div>
			</a-tab-pane>
			<a-tab-pane key="2" tab="Earnings">
				<div style="height: 450px; width: 100%">
					<Doughnut
						:data="dataEarnings"
						:options="(options as any)"
						id="stats-earnings"
					/>
				</div>
			</a-tab-pane>
		</a-tabs>
		<template #footer>
			<a-button key="back" @click="emits('close')">Close</a-button>
		</template>
	</a-modal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useCategoryStore } from '../../stores/category';

import { Transaction } from '../../models/transaction';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'vue-chartjs';
import { Category } from '../../models/category';

ChartJS.register(ArcElement, Tooltip, Legend);

const props = defineProps<{
	visible: boolean;
	month: string;
	year: string;
	expenses: Transaction[];
	earnings: Transaction[];
}>();

const emits = defineEmits(['close']);

const activeKey = ref('1');
const allCategories = computed(() => useCategoryStore().categories);

const visible = ref<boolean>(false);

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
	props.expenses
		.filter(t => !getCategory(t.category)?.excludeFromBudget)
		.forEach(t => {
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
	aggregatedCategory.sort((a, b) => b.amount - a.amount);
	legendExpenses.value = aggregatedCategory.map(c => ({
		name: c.category.name,
		amount: c.amount,
		percentage: Math.round((c.amount / total) * 100),
		color: c.category.color,
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
	props.earnings
		.filter(t => !getCategory(t.category)?.excludeFromBudget)
		.forEach(t => {
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
	aggregatedCategory.sort((a, b) => b.amount - a.amount);
	legendEarnings.value = aggregatedCategory.map(c => ({
		name: c.category.name,
		amount: c.amount,
		percentage: Math.round((c.amount / total) * 100),
		color: c.category.color,
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
