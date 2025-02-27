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
			v-for="(item, i) in sortedItems"
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
import { CloseOutlined, PlusOutlined } from '@ant-design/icons-vue';
import { computed, ref } from 'vue';
import { DataBaseClient } from '../api/db';
import Avatar from '../components/Avatar.vue';
import { Grocery } from '../models/grocery';
import { loading } from '../services/utils';

const items = ref<Grocery[]>([]);

const sortedItems = computed(() => {
	return items.value
		.filter(
			item => !newItem.value || item.label.toLowerCase().includes(newItem.value.toLowerCase())
		)
		.sort((i1, i2) => {
			const c1 = i1.checked ? 1 : -1;
			const c2 = i2.checked ? 1 : -1;
			const diff = c1 - c2;
			if (!diff) return i1.label.localeCompare(i2.label);
			return c1 - c2;
		});
});

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
