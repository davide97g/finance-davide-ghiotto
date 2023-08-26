<template>
	<Avatar :position="'topLeft'" />
	<h1>Groceries</h1>
	<p>Here is a list of groceries</p>
	<div style="display: flex; padding: 0 1rem">
		<a-input v-model:value="newItem" placeholder="Add new" />
		<a-button type="primary" @click="addNewItem" :disabled="!newItem" :loading="loading"
			>Add <PlusOutlined
		/></a-button>
	</div>
	<a-divider />
	<div
		style="
			padding: 1rem;
			display: flex;
			flex-direction: column;
			gap: 0.5rem;
			align-items: flex-start;
			max-height: calc(100vh - 200px);
			overflow-y: auto;
		"
	>
		<div
			v-for="(item, i) in items"
			:key="i"
			style="display: flex; justify-content: space-between; align-items: center; width: 100%"
		>
			<a-checkbox
				v-model:checked="item.checked"
				@change="onCheck(item)"
				:class="{ checked: item.checked }"
			>
				{{ item.label }}
			</a-checkbox>
			<CloseOutlined @click="deleteItem(item)" />
		</div>
	</div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import Avatar from '../components/Avatar.vue';
import { loading } from '../services/utils';
import { PlusOutlined, CloseOutlined } from '@ant-design/icons-vue';
import { DataBaseClient } from '../api/db';
import { Grocery } from '../models/grocery';

const items = ref<Grocery[]>([]);

const newItem = ref('');

const addNewItem = () => {
	if (newItem.value)
		DataBaseClient.Grocery.create({
			label: newItem.value,
			checked: false,
		}).then(() => {
			newItem.value = '';
		});
};

DataBaseClient.Grocery.getRT((groceries: Grocery[]) => {
	items.value = groceries;
});

const onCheck = (item: Grocery) => {
	DataBaseClient.Grocery.update({ ...item, checked: item.checked });
};

const deleteItem = (item: Grocery) => {
	DataBaseClient.Grocery.delete(item.id);
};
</script>

<style scoped lang="scss">
.checked {
	text-decoration: line-through;
}
</style>
