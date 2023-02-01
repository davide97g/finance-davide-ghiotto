<template>
	<Avatar :position="'topLeft'" />
	<h1>Piva</h1>
	<div class="flex-center" style="justify-content: space-around">
		<a-button
			type="primary"
			danger
			@click="newTransactionPopupIsVisibile = true"
			style="background: #cf1322; border-color: #cf1322"
			><PlusOutlined /> Exp</a-button
		>
		<a-button
			type="primary"
			success
			@click="newNailPopupIsVisibile = true"
			style="background: #3f8600; border-color: #3f8600; margin-left: 5px"
			><PlusOutlined /> Earn</a-button
		>
		<a-button type="primary" @click="newClientPopupIsVisibile = true"
			><PlusOutlined /> Client</a-button
		>
	</div>
	<NewTransactionPopup
		:visible="newTransactionPopupIsVisibile"
		:type="'expense'"
		:isNail="true"
		@close="newTransactionPopupIsVisibile = false"
	/>
	<NewNailPopup :visible="newNailPopupIsVisibile" @close="newNailPopupIsVisibile = false" />
	<a-tabs id="tabs" v-model:activeKey="activeYear" style="padding: 20px">
		<a-tab-pane :key="year" :tab="year" v-for="year in years">
			<a-tabs id="tabs" v-model:activeKey="activeMonth">
				<a-tab-pane :key="month" :tab="month" v-for="month in months">
					<MonthNails :month="month" :year="year" @close="closeMonth" />
				</a-tab-pane>
			</a-tabs>
		</a-tab-pane>
	</a-tabs>
	<SettingOutlined @click="sideMenuVisible = true" id="icon-open-settings" />
	<Settings :visible="sideMenuVisible" @close="sideMenuVisible = false" />
</template>

<script setup lang="ts">
import { PlusOutlined, SettingOutlined } from '@ant-design/icons-vue';

import { ref } from 'vue';
import { DataBaseClient } from '../api/db';
import Avatar from '../components/Avatar.vue';
import NewTransactionPopup from '../components/Family/NewTransactionPopup.vue';
import NewNailPopup from '../components/Piva/NewNailPopup.vue';
import { setIsLoading } from '../services/utils';
import { useCategoryStore } from '../stores/category';
import Settings from '../components/Family/Settings.vue';
import MonthNails from '../components/Piva/MonthNails.vue';

const years = ['2022', '2023'];
const months = [
	'January',
	'February',
	'March',
	'April',
	'May',
	'June',
	'July',
	'August',
	'September',
	'October',
	'November',
	'December',
];
const activeMonth = ref(months[new Date().getMonth()]);
const activeYear = ref('' + new Date().getFullYear());

const newTransactionPopupIsVisibile = ref(false);
const newNailPopupIsVisibile = ref(false);

const newClientPopupIsVisibile = ref(false); // TODO: create new client popup

const getCategories = async () => {
	setIsLoading(true);
	await DataBaseClient.Category.get('nail').then(results =>
		useCategoryStore().setCategories(results)
	);
	setIsLoading(false);
};

const sideMenuVisible = ref<boolean>(false);

const closeMonth = async () => {
	setIsLoading(true);
	await DataBaseClient.Nail.closeMonth(activeMonth.value, activeYear.value);
	setIsLoading(false);
};

getCategories();
</script>

<style scoped lang="scss">
#icon-open-settings {
	position: absolute;
	top: 10px;
	right: 10px;
	height: 25px;
	width: 25px;
}
#tabs {
	padding: 10px;
	height: calc(100vh - 100px);
}
</style>
