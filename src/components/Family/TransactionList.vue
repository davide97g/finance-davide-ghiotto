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
				<div style="position: relative; width: 100%; padding-right: 5px">
					<a-row style="width: 100%" :class="{ future: isFuture(item.date) }">
						<a-col :span="16" class="ellipsis">
							{{ item.description }}
						</a-col>
						<a-col :span="8" class="right">
							{{ formatDate(item.date) }}
						</a-col>
					</a-row>
					<a-row style="width: 100%" :class="{ future: isFuture(item.date) }">
						<a-col :span="6" class="ellipsis">€ {{ item.amount }} </a-col>
						<a-col :span="16" class="left">
							<TagCategory
								:category="getCategory(item.category)!"
								v-if="getCategory(item.category)"
							/>
						</a-col>
						<a-popconfirm
							@click.stop=""
							title="Are you sure delete this transaction?"
							ok-text="Yes"
							placement="left"
							cancel-text="No"
							@confirm="deleteTransaction(item)"
						>
							<a-col :span="2" class="right">
								<DeleteOutlined />
							</a-col>
						</a-popconfirm>
					</a-row>
					<div class="future-badge" v-if="isFuture(item.date)">
						<a-tag :color="'blue'">Future</a-tag>
					</div>
				</div>
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
	DeleteOutlined,
	ArrowDownOutlined,
	ArrowUpOutlined,
	FilterOutlined,
} from '@ant-design/icons-vue/lib/icons';
import { computed, ref } from 'vue';
import { DataBaseClient } from '../../api/db';
import { Transaction } from '../../models/transaction';
import { openNotificationWithIcon } from '../../services/utils';
import { useCategoryStore } from '../../stores/category';
import { useTransactionStore } from '../../stores/transaction';
import TagCategory from './TagCategory.vue';
import FiltersPopup from './FiltersPopup.vue';
import { CategoryType } from '../../models/category';
import UpdateTransactionPopup from './UpdateTransactionPopup.vue';

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

const deleteTransaction = (transaction: Transaction) => {
	DataBaseClient.Transaction.delete(transaction.id)
		.then(() => {
			openNotificationWithIcon(
				'success',
				'Success',
				'Deleted transaction with id: ' + transaction.id
			);
			useTransactionStore().removeTransaction(transaction);
		})
		.catch(err => {
			console.error(err);
			openNotificationWithIcon(
				'error',
				'Error',
				'Failed deleting transaction with id:' + transaction.id
			);
		});
};

const categories = computed(() =>
	useCategoryStore().categories.filter(c => c.type === 'earning' || c.type === 'expense')
);
const getCategory = (categoryId: string) => categories.value.find(c => c.id === categoryId);

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

const isFuture = (date: string) => new Date().getTime() < new Date(date).getTime();

const formatDate = (date: string) => {
	const d = new Date(date);
	return d.toLocaleDateString('it-IT');
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
}
.actions {
	margin-top: 10px;
	justify-content: space-around;
	height: 30px;
}

.future {
	opacity: 0.5;
}
.future-badge {
	position: absolute;
	top: 50%;
	left: 50%;
	transform: translate(-50%, -50%);
}
</style>
