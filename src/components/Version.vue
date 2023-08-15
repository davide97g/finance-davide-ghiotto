<script setup lang="ts">
import packageJson from '../../package.json';
</script>

<template>
	<p id="version">v{{ packageJson.version }}</p>
</template>

<style scoped>
#version {
	font-size: 10px;
}
</style>
