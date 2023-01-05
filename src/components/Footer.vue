<script setup lang="ts">
import packageJson from '../../package.json';
</script>

<template>
	<p id="version">v{{ packageJson.version }}</p>
</template>

<style scoped>
#version {
	margin: 0;
	position: absolute;
	bottom: 5px;
	right: 5px;
	text-align: right;
	font-size: 10px;
}
</style>
