<template>
	<a-list
		item-layout="horizontal"
		:data-source="transactions"
		size="medium"
		class="transaction-list"
	>
		<template #renderItem="{ item }">
			<a-list-item class="left" @click="openTransactionDetails(item)">
				<a-row style="width: 90vw">
					<a-col :span="8">
						{{ item.date }}
					</a-col>
					<a-col :span="16" class="ellipsis">
						{{ item.description }}
					</a-col>
				</a-row>
				<a-row style="width: 90vw">
					<a-col :span="8">
						<TagCategory
							:category="getCategory(item.category)!"
							v-if="getCategory(item.category)"
						/>
					</a-col>
					<a-col :span="14" class="ellipsis">€ {{ item.amount }} </a-col>
					<a-popconfirm
						@click.stop=""
						title="Are you sure delete this transaction?"
						ok-text="Yes"
						placement="bottomRight"
						cancel-text="No"
						@confirm="deleteTransaction(item)"
					>
						<a-col :span="2">
							<DeleteOutlined />
						</a-col>
					</a-popconfirm>
				</a-row>
			</a-list-item>
		</template>
	</a-list>
</template>

<script setup lang="ts">
import { DeleteOutlined } from '@ant-design/icons-vue/lib/icons';
import { computed } from 'vue';
import { DataBaseClient } from '../../api/db';
import { Transaction } from '../../models/transaction';
import { openNotificationWithIcon } from '../../services/utils';
import { useCategoryStore } from '../../stores/category';
import TagCategory from './TagCategory.vue';

const props = defineProps<{
	title: string;
	transactions: Transaction[];
}>();

const transactions = computed(() => props.transactions);

const deleteTransaction = (transaction: Transaction) => {
	DataBaseClient.Transaction.deleteTransaction(transaction.id)
		.then(() =>
			openNotificationWithIcon(
				'success',
				'Success',
				'Deleted transaction with id: ' + transaction.id
			)
		)
		.catch(err => {
			console.error(err);
			openNotificationWithIcon(
				'error',
				'Error',
				'Failed deleting transaction with id:' + transaction.id
			);
		});
};

const openTransactionDetails = (transaction: Transaction) => {
	console.info(transaction);
};

const categories = computed(() => useCategoryStore().categories);
const getCategory = (categoryId: string) => categories.value.find(c => c.id === categoryId);
</script>

<style scoped lang="scss">
.transaction-list {
	width: 90vw;
	max-height: 400px;
	overflow: auto;
}
</style>
