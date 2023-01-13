<template>
	<Avatar :position="'topLeft'" />
	<h1>Family</h1>
	<a-tabs id="tabs" v-model:activeKey="activeYear">
		<a-tab-pane :key="year" :tab="year" v-for="year in YEARS">
			<a-tabs v-model:activeKey="activeMonth">
				<a-tab-pane :key="month" :tab="month" v-for="month in MONTHS">
					<MonthBalance :month="month" :year="year" />
				</a-tab-pane>
			</a-tabs>
		</a-tab-pane>
	</a-tabs>
	<div class="flex-center" style="justify-content: space-around">
		<a-button
			type="primary"
			danger
			@click="openPopupFor('expense')"
			style="background: #cf1322; border-color: #cf1322"
			><PlusOutlined /> Exp</a-button
		>
		<a-button
			type="primary"
			success
			@click="openPopupFor('earning')"
			style="background: #3f8600; border-color: #3f8600; margin-left: 5px"
			><PlusOutlined /> Earn</a-button
		>
	</div>
	<NewTransactionPopup
		:visible="newTransactionPopupIsVisibile"
		:type="type"
		@close="newTransactionPopupIsVisibile = false"
	/>

	<SettingOutlined @click="sideMenuVisible = true" id="icon-open-settings" />
	<Settings :visible="sideMenuVisible" @close="sideMenuVisible = false" />
</template>

<script setup lang="ts">
import { SettingOutlined } from '@ant-design/icons-vue/lib/icons';
import { ref } from 'vue';
import { DataBaseClient } from '../api/db';
import Avatar from '../components/Avatar.vue';
import NewTransactionPopup from '../components/Family/NewTransactionPopup.vue';
import Settings from '../components/Family/Settings.vue';
import { MONTHS, YEARS, setIsLoading } from '../services/utils';
import { useCategoryStore } from '../stores/category';
import { PlusOutlined } from '@ant-design/icons-vue';

const activeMonth = ref(MONTHS[new Date().getMonth()]);
const activeYear = ref(new Date().getFullYear().toString());

const getCategories = async () => {
	setIsLoading(true);
	await DataBaseClient.Category.get().then(results => useCategoryStore().setCategories(results));
	setIsLoading(false);
};

// *** add new transaction popup

const newTransactionPopupIsVisibile = ref(false);
const type = ref<'expense' | 'earning'>('earning');

const openPopupFor = (_type: 'expense' | 'earning') => {
	type.value = _type;
	newTransactionPopupIsVisibile.value = true;
};

// *** side menu

const sideMenuVisible = ref<boolean>(false);

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
