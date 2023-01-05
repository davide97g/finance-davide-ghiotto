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
						<a-tag :color="getCategoryColor(item.category)">{{ item.category }}</a-tag>
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
import { DeleteOutlined, EditOutlined } from '@ant-design/icons-vue/lib/icons';
import { computed } from 'vue';
import { ITransaction } from '../../models/transaction';
import { getCategoryColor } from '../../services/utils';

const props = defineProps<{
	title: string;
	transactions: ITransaction[];
}>();

const transactions = computed(() => props.transactions);

const deleteTransaction = (transaction: ITransaction) => {
	console.info(transaction);
};

const openTransactionDetails = (transaction: ITransaction) => {
	console.info(transaction);
};
</script>

<style scoped lang="scss">
.transaction-list {
	width: 90vw;
	max-height: 400px;
	overflow: auto;
}
</style>
