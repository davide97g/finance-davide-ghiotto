<template>
	<h4>Tags</h4>
	<a-button type="primary" @click="newTagPopupIsVisibile = true"> Add New </a-button>
	<NewTagPopup :visible="newTagPopupIsVisibile" @close="newTagPopupIsVisibile = false" />
	<a-divider />
	<UpdateTagPopup
		:visible="updateTagPopupIsVisibile"
		:tag="selectedTag"
		@close="updateTagPopupIsVisibile = false"
	/>
	<div class="flex-gap" style="max-height: 300px; overflow: auto">
		<TagBadge :removable="true" :tag="tag" @click="onTagSelected(tag)" v-for="tag in tags" />
	</div>
	<a-divider />
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { Tag } from '../../../models/tag';
import { useTagStore } from '../../../stores/tag';
import NewTagPopup from './NewTagPopup.vue';
import TagBadge from '../../Badges/Tag.vue';
import UpdateTagPopup from './UpdateTagPopup.vue';

const newTagPopupIsVisibile = ref(false);

const tags = computed(() => useTagStore().tags);

const updateTagPopupIsVisibile = ref(false);
const selectedTag = ref<Tag>();
const onTagSelected = (tag: Tag) => {
	selectedTag.value = tag;
	updateTagPopupIsVisibile.value = true;
};
</script>
