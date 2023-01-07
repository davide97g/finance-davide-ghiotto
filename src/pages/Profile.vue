<template>
	<Avatar :position="'topCenter'" :size="'large'" />
	<div style="margin-top: 170px; margin-bottom: 20px">
		<h1>Profile</h1>
		<p>Name: {{ useUserStore().user?.displayName }}</p>
		<p>Email: {{ useUserStore().user?.email }}</p>
		<a-button type="primary" danger @click="FirebaseAuth.signOut">Log out</a-button>
	</div>
	<router-link :to="{ name: HomePageName }">
		<a-button type="primary">Home</a-button>
	</router-link>
</template>

<script lang="ts" setup>
import { FirebaseAuth } from '../api/auth';
import Avatar from '../components/Avatar.vue';
import { HomePageName } from '../router';
import { useUserStore } from '../stores/user';
</script>

<style lang="scss" scoped></style>
