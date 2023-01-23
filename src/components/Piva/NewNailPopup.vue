<template>
	<a-modal
		v-model:visible="visible"
		:title="'New Nail'"
		@cancel="emits('close')"
		:loading="loading"
		:disabled="true"
	>
		<div class="input-form">
			<a-row class="full-width" style="flex-direction: column">
				<p>Date</p>
				<a-input
					class="full-width"
					type="date"
					v-model:value="nail.datetime"
					placeholder="Choose a date"
				/>
			</a-row>
			<a-row class="full-width" style="margin-top: 10px">
				<p>Description</p>
				<a-input
					class="full-width"
					type="text"
					v-model:value="nail.clientId"
					placeholder="Enter a clientId"
				/>
				<a-button>New Client ?</a-button>
			</a-row>
			<a-row class="full-width" style="margin-top: 10px">
				<a-col :span="12">
					<p>Amount</p>
					<a-input-number
						class="full-width"
						v-model:value="nail.amount"
						placeholder="Enter an amount"
						:min="0"
						:precision="2"
					></a-input-number
				></a-col>
				<a-col :span="12">
					<p>Category</p>
					<a-select class="full-width" ref="select" v-model:value="nail.category">
						<a-select-option
							v-for="category in categories"
							:key="category.id"
							:value="category.id"
							>{{ category.name.toLowerCase() }}</a-select-option
						>
					</a-select>
				</a-col>
			</a-row>
		</div>
		<template #footer>
			<a-button key="back" @click="emits('close')">Return</a-button>
			<a-button
				key="submit"
				type="primary"
				:loading="loading"
				@click="handleOk"
				:disabled="!nail.amount || !nail.datetime || !nail.clientId || !nail.category"
				>Create</a-button
			>
		</template>
	</a-modal>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import {
	formatDate,
	loading,
	MONTHS,
	openNotificationWithIcon,
	setIsLoading,
} from '../../services/utils';
import { DataBaseClient } from '../../api/db';
import { useCategoryStore } from '../../stores/category';
import { INail, NailType } from '../../models/nail';
import { useNailStore } from '../../stores/nail';

const props = defineProps<{
	visible: boolean;
}>();

const emits = defineEmits(['close', 'ok']);

const visible = ref<boolean>(false);
const newNail = (): INail => ({
	datetime: formatDate(new Date().toISOString()),
	amount: 0,
	category: '' as NailType,
	month: MONTHS[new Date().getMonth()],
	year: new Date().getFullYear().toString(),
	clientId: '',
});

const nail = ref<INail>(newNail());
const resetNail = () => (nail.value = newNail());

watch(
	() => nail.value.datetime,
	date => {
		const dateObj = new Date(date);
		nail.value.month = MONTHS[dateObj.getMonth()];
		nail.value.year = dateObj.getFullYear().toString();
	}
);
watch(
	() => props.visible,
	() => (visible.value = props.visible)
);

watch(
	() => visible.value,
	() => {
		if (!visible.value) emits('close');
	}
);

const allCategories = computed(() => useCategoryStore().categories);
const categories = computed(() => allCategories.value.filter(c => c.type === 'nail'));

const handleOk = () => {
	setIsLoading(true);
	DataBaseClient.Nail.create(nail.value)
		.then(nail => {
			openNotificationWithIcon('success', 'Success', 'Nail ' + nail.id + ' saved');
			useNailStore().addNail(nail);
			resetNail();
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
