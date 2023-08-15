<template>
	<a-modal
		v-model:visible="visible"
		title="New Tag"
		@cancel="emits('close')"
		:loading="loading"
		:disabled="true"
	>
		<div class="input-form center">
			<a-row class="full-width" style="margin-top: 10px">
				<p>Name</p>
				<a-input
					class="full-width"
					type="text"
					v-model:value="tag.name"
					placeholder="Ex. ABC23"
					:maxlength="5"
				/>
			</a-row>
			<a-row class="full-width" style="margin-top: 10px">
				<p>Description</p>
				<a-input
					name="description"
					class="full-width"
					type="text"
					v-model:value="tag.description"
					placeholder="Optional description"
				/>
			</a-row>
			<a-row class="full-width flex-center" style="margin-top: 10px">
				<a-col :span="10">
					<p>Color</p>
					<a-input
						name="color"
						type="color"
						v-model:value="tag.color"
						placeholder="Background color"
					></a-input>
				</a-col>
			</a-row>
		</div>
		<a-divider></a-divider>
		<div class="tag-preview flex-center" v-if="tag.name">
			<p>Preview</p>
			<a-tooltip>
				<template #title v-if="tag.description">{{ tag.description }}</template>
				<a-tag :color="tag.color" size="large">{{ tag.name }}</a-tag>
			</a-tooltip>
		</div>
		<template #footer>
			<a-button key="back" @click="emits('close')">Cancel</a-button>
			<a-button
				key="submit"
				type="primary"
				:loading="loading"
				@click="handleOk"
				:disabled="!tag.name"
				>Create</a-button
			>
		</template>
	</a-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { ITag } from '../../../models/tag';
import { loading, openNotificationWithIcon, setIsLoading } from '../../../services/utils';
import { DataBaseClient } from '../../../api/db';
import { useTagStore } from '../../../stores/tag';

const props = defineProps<{
	visible: boolean;
}>();

const emits = defineEmits(['close', 'ok']);

const visible = ref<boolean>(false);
const newTag = (): ITag => ({
	name: '',
	description: undefined,
	color: '#ababab',
});
const tag = ref<ITag>(newTag());
const resetTag = () => (tag.value = newTag());

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

const handleOk = () => {
	setIsLoading(true);
	DataBaseClient.Tag.create(tag.value)
		.then(tag => {
			openNotificationWithIcon('success', 'Success', 'Tag ' + tag.name + ' created');
			useTagStore().addTag(tag);
			resetTag();
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
.tag-preview {
	justify-content: space-around;
	p {
		margin-bottom: 0;
	}
}
</style>
