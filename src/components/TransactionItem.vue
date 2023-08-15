<template>
	<div
		style="
			position: relative;
			width: 100%;
			padding-right: 5px;
			display: flex;
			flex-direction: column;
			gap: 0.5rem;
		"
	>
		<a-row style="width: 100%">
			<a-col
				:span="16"
				class="ellipsis"
				style="text-transform: capitalize; display: flex; align-items: center; gap: 0.25rem"
			>
				<img
					v-if="useUserStore().user?.photoURL"
					:src="useUserStore().user?.photoURL!"
					height="20"
					width="20"
					alt="author_img_pic"
					style="border-radius: 50%"
				/>
				<a-typography-text strong>
					{{ item.description }}
				</a-typography-text>
			</a-col>
			<a-col :span="8" class="right" style="display: flex; justify-content: flex-end">
				<div v-if="getCategory(item.category)?.excludeFromBudget">
					<a-tag :color="'gray'">E</a-tag>
				</div>
				<a-typography-text keyboard>{{ item.amount }} €</a-typography-text>
			</a-col>
		</a-row>
		<a-row style="width: 100%">
			<a-col :span="5" class="left">
				<a-typography-text code
					>{{ formatDate(item.date, true) }}
					<CalendarOutlined />
				</a-typography-text>
			</a-col>
			<a-col :span="13" class="left">
				<Category
					:category="getCategory(item.category)!"
					v-if="getCategory(item.category)"
				/>
			</a-col>
			<a-col :span="4" class="left">
				<Tag
					:tag="getTag(item.tag)!"
					v-if="getTag(item.tag) && item.tag !== 'XB0kK9DnZIIEsPKsaWEB'"
				/>
			</a-col>
			<a-col :span="2" class="center">
				<a-popconfirm
					@click.stop=""
					title="Are you sure delete this transaction?"
					ok-text="Yes"
					placement="left"
					cancel-text="No"
					@confirm="deleteTransaction(item)"
				>
					<DeleteOutlined />
				</a-popconfirm>
			</a-col>
		</a-row>
	</div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import { DataBaseClient } from '../api/db';
import { Transaction } from '../models/transaction';
import { formatDate, openNotificationWithIcon } from '../services/utils';
import { useTransactionStore } from '../stores/transaction';
import { useCategoryStore } from '../stores/category';
import { useTagStore } from '../stores/tag';
import { DeleteOutlined, CalendarOutlined } from '@ant-design/icons-vue/lib/icons';
import Category from './Badges/Category.vue';
import Tag from './Badges/Tag.vue';
import { useUserStore } from '../stores/user';

const props = defineProps<{
	item: Transaction;
}>();

const item = props.item;

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
const tags = computed(() => useTagStore().tags);

const getCategory = (categoryId: string) => categories.value.find(c => c.id === categoryId);
const getTag = (tagId?: string) => tags.value.find(t => t.id === tagId);
</script>
