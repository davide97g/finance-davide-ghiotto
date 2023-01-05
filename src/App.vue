<script setup lang="ts">
import { isMobile, setIsLoading } from './services/utils';

setIsLoading(false);
</script>

<template>
	<div id="router-view" :class="{ mobile: isMobile }">
		<router-view />
	</div>
</template>

<style scoped lang="scss">
#router-view {
	height: 100vh;
	overflow: auto;
	&.mobile {
		height: 100vh;
	}
}
</style>
