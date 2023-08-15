<template>
	<a-modal
		v-model:visible="visible"
		title="Modify Tag"
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
		<a-row v-if="props.tag">
			<a-col :span="12">
				<div class="tag-preview flex-center">
					<p>Previous</p>
					<a-tooltip>
						<template #title v-if="props.tag.description">{{
							props.tag.description
						}}</template>
						<a-tag :color="props.tag.color" size="large">{{ props.tag.name }}</a-tag>
					</a-tooltip>
				</div>
			</a-col>
			<a-col :span="12">
				<div class="tag-preview flex-center" v-if="tag.name">
					<p>Preview</p>
					<a-tooltip>
						<template #title v-if="tag.description">{{ tag.description }}</template>
						<a-tag :color="tag.color" size="large">{{ tag.name }}</a-tag>
					</a-tooltip>
				</div>
			</a-col>
		</a-row>
		<template #footer>
			<a-button key="back" @click="emits('close')">Cancel</a-button>
			<a-button
				key="submit"
				type="primary"
				:loading="loading"
				@click="handleOk"
				:disabled="!tag.name"
				>Update</a-button
			>
		</template>
	</a-modal>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { Tag } from '../../../models/tag';
import { loading, openNotificationWithIcon, setIsLoading } from '../../../services/utils';
import { DataBaseClient } from '../../../api/db';
import { useTagStore } from '../../../stores/tag';

const props = defineProps<{
	visible: boolean;
	tag?: Tag;
}>();
const emits = defineEmits(['close', 'ok']);

const visible = ref<boolean>(false);
const tag = ref<Tag>(JSON.parse(JSON.stringify(props.tag || {})));

watch(
	() => props.visible,
	() => (visible.value = props.visible)
);
watch(
	() => props.tag,
	() => (tag.value = JSON.parse(JSON.stringify(props.tag || {})))
);
watch(
	() => visible.value,
	() => {
		if (!visible.value) emits('close');
	}
);

const handleOk = () => {
	setIsLoading(true);
	DataBaseClient.Tag.update(tag.value)
		.then(() => {
			openNotificationWithIcon('success', 'Success', 'Tag ' + tag.value.name + ' updated');
			useTagStore().updateTag(tag.value);
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
