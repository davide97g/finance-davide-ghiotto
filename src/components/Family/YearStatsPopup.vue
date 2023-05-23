<template>
	<a-modal
		v-model:visible="visible"
		:title="`Stats for ${props.year}`"
		@cancel="emits('close')"
		:disabled="true"
	>
		<a-tabs v-model:activeKey="activeKey" v-if="earnings.length || expenses.length">
			<a-tab-pane key="1" tab="Monthly Overview">
				<div style="height: 450px; width: 100%">
					<Bar :data="dataMonthly" :options="(options as any)" id="stats-monthly" />
				</div>
			</a-tab-pane>
		</a-tabs>
		<div v-else>
			<p>No data available for this year</p>
			<p>Would you like to freeze this year?</p>
			<a-button type="primary" @click="emits('freeze')">Freeze</a-button>
		</div>
		<template #footer>
			<a-button key="back" @click="emits('close')">Close</a-button>
			<a-button type="primary" key="enter" @click="emits('freeze')">Freeze</a-button>
		</template>
	</a-modal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';

import {
	Chart as ChartJS,
	ArcElement,
	Tooltip,
	Legend,
	CategoryScale,
	LinearScale,
	BarElement,
} from 'chart.js';
import { Bar } from 'vue-chartjs';
import { Stats } from '../../models/stats';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const props = defineProps<{
	visible: boolean;
	year: string;
	expenses: Stats[];
	earnings: Stats[];
}>();

const emits = defineEmits(['close', 'freeze']);

const activeKey = ref('1');

const visible = ref<boolean>(false);

const dataMonthly = computed(() => {
	const months = props.expenses
		.map(e => e.month)
		.sort((a, b) => {
			const aDate = new Date(`1 ${a}`);
			const bDate = new Date(`1 ${b}`);
			console.log(aDate, bDate);
			return aDate.getTime() - bDate.getTime();
		});
	const monthsEarnings = months.map(m => props.earnings.find(e => e.month === m)!);
	const monthsExpenses = months.map(m => props.expenses.find(e => e.month === m)!);
	const data = {
		labels: months,
		datasets: [
			{
				label: 'Expenses',
				backgroundColor: '#cf1322',
				data: monthsExpenses.map(e => e.total),
				// change color
				color: '#ababab',
			},
			{
				label: 'Earnings',
				backgroundColor: '#3f8600',
				data: monthsEarnings.map(e => e.total),
			},
		],
	};
	console.log(data);
	return data;
});

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
