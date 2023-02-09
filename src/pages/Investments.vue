<template>
	<Avatar :position="'topLeft'" />
	<h1>Investments</h1>
	<a-row>
		<a-col :span="12">
			<a-statistic
				title="Invested"
				:value="24000"
				:precision="0"
				suffix="€"
				:value-style="{
					color: '#cf1322',
				}"
			/>
		</a-col>
		<a-col :span="12">
			<a-statistic
				title="Profit/Loss"
				:value="3000"
				:precision="0"
				suffix="€"
				:value-style="{ color: '#3f8600' }"
			/>
		</a-col>
	</a-row>
</template>

<script setup lang="ts">
import Avatar from '../components/Avatar.vue';
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
