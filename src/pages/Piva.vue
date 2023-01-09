<template>
	<Avatar :position="'topLeft'" />
	<h1>Piva</h1>
	<p>Coming soon</p>
	<ul>
		<li>create client</li>
		<li>new nails</li>
		<li>new product purchase</li>
	</ul>
	<a-tabs id="tabs" v-model:activeKey="activeYear" style="padding: 20px">
		<a-tab-pane :key="year" :tab="year" v-for="year in years">
			<a-tabs id="tabs" v-model:activeKey="activeMonth">
				<a-tab-pane :key="month" :tab="month" v-for="month in months">
					<NailList :month="month" :year="year" />
				</a-tab-pane>
			</a-tabs>
		</a-tab-pane>
	</a-tabs>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Avatar from '../components/Avatar.vue';
import NailList from '../components/Piva/NailList.vue';
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
</script>
