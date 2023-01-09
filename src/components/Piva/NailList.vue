<template>
	<ul v-if="nails.length">
		<li v-for="nail in nails" :key="nail.id">
			{{ nail.id }}
			{{ nail.amount }}
		</li>
	</ul>
	<p v-else>Nothing to show</p>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { DataBaseClient } from '../../api/db';
import { useNailStore } from '../../stores/nail';

const props = defineProps<{
	month: string;
	year: string;
}>();

const nails = computed(() => useNailStore().nails);
DataBaseClient.Nail.get(props.month, props.year).then(results => useNailStore().setNails(results));
</script>
