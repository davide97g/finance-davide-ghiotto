<template>
	<a-modal
		v-model:visible="visible"
		title="Update Nail 💅"
		@cancel="emits('close')"
		:loading="loading"
		:disabled="true"
	>
		<div class="input-form">
			<a-input
				class="full-width"
				type="date"
				v-model:value="nail.datetime"
				placeholder="Choose a date"
				style="margin-top: 10px"
			></a-input>
			<a-input
				class="full-width"
				type="text"
				v-model:value="nail.clientId"
				placeholder="Enter a clientId"
				style="margin-top: 10px"
			></a-input>
			<a-input-number
				class="full-width"
				v-model:value="nail.amount"
				placeholder="Enter an amount"
				:min="0"
				:precision="2"
				style="margin-top: 10px"
			></a-input-number>
			<a-select
				class="full-width"
				ref="select"
				v-model:value="nail.category"
				style="margin-top: 10px"
			>
				<a-select-option
					v-for="category in categories"
					:key="category.id"
					:value="category.id"
					>{{ category.name }}</a-select-option
				>
			</a-select>
			<a-checkbox v-model:checked="nail.hasInvoice" style="margin-top: 20px"
				>Invoice?</a-checkbox
			>
		</div>
		<template #footer>
			<a-button key="back" @click="emits('close')">Cancel</a-button>
			<a-button
				key="submit"
				type="primary"
				:loading="loading"
				@click="handleOk"
				:disabled="
					!nail.amount ||
					!nail.datetime ||
					!nail.clientId ||
					!nail.category ||
					equals(nail, props.nail)
				"
				>Update</a-button
			>
		</template>
	</a-modal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
	clone,
	equals,
	loading,
	openNotificationWithIcon,
	setIsLoading,
} from '../../services/utils';
import { DataBaseClient } from '../../api/db';
import { useCategoryStore } from '../../stores/category';
import { Nail } from '../../models/nail';
import { useNailStore } from '../../stores/nail';

const props = defineProps<{
	visible: boolean;
	nail: Nail;
}>();

const emits = defineEmits(['close']);

const visible = ref<boolean>(false);
const nail = ref<Nail>(clone(props.nail));

watch(
	() => props.visible,
	() => (visible.value = props.visible)
);
watch(
	() => props.nail,
	() => (nail.value = clone(props.nail))
);

watch(
	() => visible.value,
	() => {
		if (!visible.value) emits('close');
	}
);

const categories = computed(() => useCategoryStore().categories.filter(c => c.type === 'nail'));

const handleOk = () => {
	setIsLoading(true);
	DataBaseClient.Nail.update(nail.value)
		.then(() => {
			openNotificationWithIcon('success', 'Success', 'Nail ' + nail.value.id + ' updated');
			useNailStore().updateNail(nail.value);
			emits('close');
		})
		.catch(err => console.error(err))
		.finally(() => setIsLoading(false));
};
</script>

<style lang="scss" scoped>
.input-form {
	display: flex;
	flex-direction: column;
	justify-content: flex-start;
	align-items: flex-start;
}
</style>
