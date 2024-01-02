<template>
	<a-modal
		v-model:visible="visible"
		:title="`Stats for ${props.year}`"
		@cancel="emits('close')"
		:disabled="true"
	>
		<a-row>
			<a-col :span="6">
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
			<a-col :span="6">
				<a-statistic
					title="Tot Earnings"
					:value="totalSumEarnings"
					:precision="0"
					suffix="€"
					:value-style="{ color: '#3f8600' }"
				/>
			</a-col>
			<a-col :span="6">
				<a-statistic
					title="Tot Expenses"
					:value="totalSumExpenses"
					:precision="0"
					suffix="€"
					:value-style="{ color: '#cf1322' }"
				/>
			</a-col>
			<a-col :span="6">
				<a-statistic
					title="Saving Rate"
					:value="savingRate"
					:precision="2"
					suffix="%"
					:value-style="{
						color: savingRate ? '#3f8600' : '#cf1322',
					}"
				/>
			</a-col>
		</a-row>
		<a-tabs v-model:activeKey="activeKey" v-if="earnings.length || expenses.length">
			<a-tab-pane key="1" tab="Monthly Overview">
				<div style="height: 450px; width: 100%">
					<Bar :data="dataMonthly" :options="(options as any)" id="stats-monthly" />
				</div>
			</a-tab-pane>
			<a-tab-pane key="2" tab="Categories">
				<YearStatsCategories :expenses="expenses" :earnings="earnings" />
			</a-tab-pane>
		</a-tabs>
		<div v-else>
			<p>No data available for this year</p>
			<p>Would you like to freeze this year?</p>
			<a-button type="primary" @click="emits('freeze')">Freeze</a-button>
		</div>
		<template #footer>
			<a-button key="back" @click="emits('close')">Close</a-button>
			<a-button type="primary" key="enter" @click="emits('freeze')">{{
				expenses.length > 0 || earnings.length > 0 ? 'Update' : 'Freeze'
			}}</a-button>
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
import { IStats } from '../../models/stats';
import YearStatsCategories from './YearStatsCategories.vue';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

const props = defineProps<{
	visible: boolean;
	year: string;
	expenses: IStats[];
	earnings: IStats[];
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
	return data;
});

const totalSumExpenses = computed(
	() => -1 * props.expenses.reduce((acc, curr) => acc + curr.total, 0)
);
const totalSumEarnings = computed(() => props.earnings.reduce((acc, curr) => acc + curr.total, 0));

const savingRate = computed(
	() => (100 * (totalSumEarnings.value + totalSumExpenses.value)) / totalSumEarnings.value
);

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
