<template>
	<div
		style="
			display: flex;
			flex-direction: column;
			height: 100vh;
			align-items: center;
			justify-content: center;
		"
	>
		<h1>Personal Finance</h1>
		<p>Welcome to the Finance part of my website</p>
		<p>Here we managed our personal finances.</p>
		<router-link to="/family" style="margin-top: 50px">
			<a-button type="primary">Family Balance</a-button>
		</router-link>
		<Footer />
	</div>
</template>

<script setup lang="ts">
import Footer from '../components/Footer.vue';
</script>
