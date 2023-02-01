<template>
	<a-tabs v-model:activeKey="activeKey">
		<a-tab-pane key="1" tab="Earnings">
			<NailList :month="month" :year="year" />
		</a-tab-pane>
		<a-tab-pane key="2" tab="Expenses">
			<TransactionList :type="'expense'" :title="'Expenses'" :transactions="expenses" />
		</a-tab-pane>
	</a-tabs>
	<a-row class="flex-center">
		<a-col :span="12">
			<a-button type="success" @click="importFromCSV"><ImportOutlined /> Import CSV</a-button>
		</a-col>
		<a-col :span="12">
			<a-button type="primary" @click="emits('close')"
				><CloseOutlined /> Close Month</a-button
			>
		</a-col>
	</a-row>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import NailList from './NailList.vue';
import { CloseOutlined, ImportOutlined } from '@ant-design/icons-vue';
import { useTransactionStore } from '../../stores/transaction';
import { DataBaseClient } from '../../api/db';
import { formatDate, openNotificationWithIcon } from '../../services/utils';
import { ITransaction } from '../../models/transaction';
import { INail } from '../../models/nail';
import { useNailStore } from '../../stores/nail';
const activeKey = ref('1');
const emits = defineEmits(['close']);
const props = defineProps<{
	month: string;
	year: string;
}>();

const expenses = computed(() => {
	return useTransactionStore().expenses.filter(
		t =>
			t.month === props.month &&
			t.year === props.year &&
			t.category === 'WuNj7dDtoKstlO5VTFXz'
	);
});

const getExpenses = () =>
	DataBaseClient.Transaction.get({ month: props.month, year: props.year, type: 'expense' }).then(
		results => useTransactionStore().setTransactions(results)
	);
getExpenses();

const importFromCSV = () => {
	// get input file from user
	const input = document.createElement('input');
	input.type = 'file';
	input.accept = '.csv';
	input.onchange = e => {
		const file = (e.target as HTMLInputElement)!.files![0];
		const reader = new FileReader();
		reader.onload = e => {
			const text = (e.target as FileReader).result as string;
			const lines = text.split('\n');
			lines.shift();
			const nails: INail[] = lines
				.map(line => {
					const [amountString, _, clientName, fatturaString] = line.split(',');
					const amount = parseFloat(amountString.replace('"', ''));
					const fattura = fatturaString === 'TRUE';
					const client = clientName.trim();
					if (amount) {
						return {
							amount,
							clientId: client,
							hasInvoice: fattura,
							datetime: formatDate(new Date().toISOString()),
							month: props.month,
							year: props.year,
							type: 'nail',
							category: 'YqtVX7Q1qJayVo9wMzsA',
						} as INail;
					} else return {} as INail;
				})
				.filter(t => !!t && t.amount > 0);
			if (nails.length > 0) {
				DataBaseClient.Nail.bulkAdd(nails).then(results => {
					openNotificationWithIcon('success', 'Success', 'Nails imported successfully');
					useNailStore().setNails(results);
				});
			}
		};
		reader.readAsText(file);
	};
	input.click();
};
</script>

<style scoped lang="scss">
#tabs {
	padding: 10px;
	height: calc(100vh - 100px);
}
</style>
