<template>
	<UpdateTransactionPopup
		:visible="updateTransactionPopupVisible"
		:transaction="selectedTransaction!"
		@close="updateTransactionPopupVisible = false"
	/>
	<a-list
		item-layout="horizontal"
		:data-source="transactions"
		size="medium"
		class="transaction-list"
	>
		<template #renderItem="{ item }">
			<a-list-item class="left" @click="openTransactionDetails(item)">
				<TransactionItem :item="item" />
			</a-list-item>
		</template>
	</a-list>
	<div class="actions flex-center full-width">
		<a-button
			type="link"
			:disabled="useTransactionStore().sorting == 'ascending'"
			@click="useTransactionStore().sortTransactions(true)"
		>
			<ArrowUpOutlined /> Old
		</a-button>
		<a-button
			type="link"
			:disabled="useTransactionStore().sorting == 'descending'"
			@click="useTransactionStore().sortTransactions(false)"
		>
			<ArrowDownOutlined /> Recent
		</a-button>
		<a-button type="link" @click="filtersPopupVisible = true">
			<a-badge :count="filters.categoryIds?.length" :overflowCount="9" :offset="[10, 0]">
				<FilterOutlined /> Filter
			</a-badge>
		</a-button>
	</div>
	<FiltersPopup
		:type="props.type"
		:visible="filtersPopupVisible"
		:filters="filters"
		@ok="filterTransactions"
		@close="filtersPopupVisible = false"
	/>
</template>

<script setup lang="ts">
import {
	ArrowDownOutlined,
	ArrowUpOutlined,
	FilterOutlined,
} from '@ant-design/icons-vue/lib/icons';
import { computed, ref } from 'vue';
import { Transaction } from '../../models/transaction';
import { useTransactionStore } from '../../stores/transaction';

import FiltersPopup from './FiltersPopup.vue';
import { CategoryType } from '../../models/category';
import UpdateTransactionPopup from './UpdateTransactionPopup.vue';
import TransactionItem from '../TransactionItem.vue';

export interface Filters {
	categoryIds?: string[];
}

const filters = ref<Filters>({});

const props = defineProps<{
	title: string;
	type: CategoryType;
	transactions: Transaction[];
}>();

const transactions = computed(() => {
	if (filters.value.categoryIds?.length && filters.value.categoryIds?.length > 0) {
		return props.transactions.filter(t => filters.value.categoryIds?.includes(t.category));
	} else return props.transactions;
});

const filtersPopupVisible = ref(false);

const filterTransactions = (newFilters: Filters) => {
	filters.value = newFilters;
	filtersPopupVisible.value = false;
};

const updateTransactionPopupVisible = ref(false);
const selectedTransaction = ref<Transaction>();

const openTransactionDetails = (transaction: Transaction) => {
	selectedTransaction.value = transaction;
	updateTransactionPopupVisible.value = true;
};
</script>

<style scoped lang="scss">
.transaction-list {
	width: 100%;
	height: calc(100vh - 410px);
	overflow: auto;
	padding: 10px;
	padding-bottom: 20px;
	background-color: #e2f0e2;
	box-shadow: inset 0 0 12px #ccc;
	.ant-list-item {
		border-width: 3px;
	}
}
.actions {
	margin-top: 10px;
	justify-content: space-around;
	height: 30px;
}
</style>
