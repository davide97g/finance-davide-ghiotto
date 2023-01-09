<template>
	<Avatar :position="'topCenter'" v-if="isLoggedIn" :size="'large'" />
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
			<router-link :to="{ name: LoginPageName }" v-if="!isLoggedIn">
				<a-button type="primary">Login</a-button>
			</router-link>
			<p v-else-if="!isAdmin">
				I'm sorry but the public areas of the website are still under construction.
			</p>
			<div class="flex-center column" v-else>
				<router-link :to="{ name: FamilyPageName }" class="m1">
					<a-button type="primary">Family Balance</a-button>
				</router-link>
				<router-link :to="{ name: PivaPageName }">
					<a-button type="primary">Kristina Piva</a-button>
				</router-link>
			</div>
		</div>
		<Footer />
	</div>
</template>

<script setup lang="ts">
import Avatar from '../components/Avatar.vue';
import Footer from '../components/Footer.vue';
import { FamilyPageName, LoginPageName, PivaPageName } from '../router';
import { isAdmin, isLoggedIn } from '../services/utils';
</script>
