<template>
	<a-drawer v-model:visible="visible" title="Settings" placement="right">
		<CategoriesSettings />
		<TagsSettings />
	</a-drawer>
</template>

<script setup lang="ts">
import { watch, ref } from 'vue';
import CategoriesSettings from './CategoriesSettings.vue';
import TagsSettings from './TagsSettings.vue';

const props = defineProps<{
	visible: boolean;
}>();
const emits = defineEmits(['close']);

const visible = ref(props.visible);

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
</script>
