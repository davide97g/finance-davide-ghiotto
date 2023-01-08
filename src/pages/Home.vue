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
		<p>Here I managed my personal finances.</p>
		<div style="margin-top: 50px">
			<router-link to="/login" v-if="!isLoggedIn">
				<a-button type="primary">Login</a-button>
			</router-link>
			<p v-else-if="!isAdmin">
				I'm sorry but the public areas of the website are still under construction.
			</p>
			<router-link to="/family" v-else>
				<a-button type="primary">Family Balance</a-button>
			</router-link>
			<br />
			<br />
			<router-link to="/profile" v-if="isLoggedIn">
				<a-button type="primary">My Profile</a-button>
			</router-link>
		</div>
		<Footer />
	</div>
</template>

<script setup lang="ts">
import Footer from '../components/Footer.vue';
import { isLoggedIn, isAdmin } from '../services/utils';
</script>
