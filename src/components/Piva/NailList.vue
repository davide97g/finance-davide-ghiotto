<template>
	<UpdateNailPopup
		:visible="updateNailPopupVisible"
		:nail="selectedNail!"
		@close="updateNailPopupVisible = false"
	/>
	<a-list item-layout="horizontal" :data-source="nails" size="medium" class="nail-list">
		<template #renderItem="{ item }">
			<a-list-item class="left" @click="openNailDetails(item)">
				<div style="position: relative; width: 100%; padding-right: 5px">
					<a-row style="width: 100%">
						<a-col :span="16" class="ellipsis">
							{{ item.clientId }}
						</a-col>
						<a-col :span="8" class="right">
							{{ formatDate(item.datetime) }}
						</a-col>
					</a-row>
					<a-row style="width: 100%">
						<a-col :span="6" class="ellipsis">€ {{ item.amount }} </a-col>
						<a-col :span="14" class="left">
							<TagCategory
								:category="getCategory(item.category)!"
								v-if="getCategory(item.category)"
							/>
						</a-col>
						<a-col :span="2" class="right" @click.stop="">
							<a-tooltip v-if="item.hasInvoice">
								<template #title>Invoice emitted</template>
								<FileDoneOutlined />
							</a-tooltip>
						</a-col>
						<a-popconfirm
							@click.stop=""
							title="Are you sure delete this transaction?"
							ok-text="Yes"
							placement="left"
							cancel-text="No"
							@confirm="deleteNail(item)"
						>
							<a-col :span="2" class="right">
								<DeleteOutlined />
							</a-col>
						</a-popconfirm>
					</a-row>
				</div>
			</a-list-item>
		</template>
	</a-list>
	<div class="actions flex-center full-width">
		<a-button
			type="link"
			:disabled="useNailStore().sorting == 'ascending'"
			@click="useNailStore().sortNails(true)"
		>
			<ArrowUpOutlined /> Old
		</a-button>
		<a-button
			type="link"
			:disabled="useNailStore().sorting == 'descending'"
			@click="useNailStore().sortNails(false)"
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
		:type="'nail'"
		:visible="filtersPopupVisible"
		:filters="filters"
		@ok="filterNails"
		@close="filtersPopupVisible = false"
	/>
</template>

<script setup lang="ts">
import {
	DeleteOutlined,
	ArrowDownOutlined,
	ArrowUpOutlined,
	FilterOutlined,
	FileDoneOutlined,
} from '@ant-design/icons-vue/lib/icons';
import { computed, ref } from 'vue';
import { DataBaseClient } from '../../api/db';
import { Nail } from '../../models/nail';
import { openNotificationWithIcon } from '../../services/utils';
import { useCategoryStore } from '../../stores/category';
import { useNailStore } from '../../stores/nail';
import TagCategory from '../Family/TagCategory.vue';
import FiltersPopup from '../Family/FiltersPopup.vue';
import UpdateNailPopup from './UpdateNailPopup.vue';

export interface Filters {
	categoryIds?: string[];
}

const filters = ref<Filters>({});

const props = defineProps<{
	month: string;
	year: string;
}>();

const nails = computed(() =>
	useNailStore().nails.filter(n => n.month === props.month && n.year === props.year)
);
DataBaseClient.Nail.get(props.month, props.year).then(results => useNailStore().setNails(results));

const deleteNail = (nail: Nail) => {
	DataBaseClient.Nail.delete(nail.id)
		.then(() => {
			openNotificationWithIcon('success', 'Success', 'Deleted nail with id: ' + nail.id);
			useNailStore().removeNail(nail);
		})
		.catch(err => {
			console.error(err);
			openNotificationWithIcon('error', 'Error', 'Failed deleting nail with id:' + nail.id);
		});
};

const categories = computed(() => useCategoryStore().categories.filter(c => c.type === 'nail'));
const getCategory = (categoryId: string) => categories.value.find(c => c.id === categoryId);

const filtersPopupVisible = ref(false);

const filterNails = (newFilters: Filters) => {
	filters.value = newFilters;
	filtersPopupVisible.value = false;
};

const updateNailPopupVisible = ref(false);
const selectedNail = ref<Nail>();

const openNailDetails = (nail: Nail) => {
	selectedNail.value = nail;
	updateNailPopupVisible.value = true;
};

const formatDate = (date: string) => {
	const d = new Date(date);
	return d.toLocaleDateString('it-IT');
};
</script>

<style scoped lang="scss">
.nail-list {
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
</style>
