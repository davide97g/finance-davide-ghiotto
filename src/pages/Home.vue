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
		<Version />
		<h1>Personal Finance</h1>
		<p>Welcome to the Finance part of my website</p>
		<p>Here I managed my personal finances.</p>
		<a-divider />
		<div v-if="isLoggedIn !== undefined">
			<router-link :to="{ name: LoginPageName }" v-if="!isLoggedIn">
				<a-button type="primary">Login</a-button>
			</router-link>
			<p v-else-if="!isAdmin">
				I'm sorry but the public areas of the website are still under construction.
			</p>
			<div class="flex-center column" v-else>
				<router-link :to="{ name: FamilyPageName }" class="m1">
					<a-button type="primary"> <EuroCircleOutlined /> Family Balance</a-button>
				</router-link>
				<router-link :to="{ name: GroceriesPageName }" class="m1">
					<a-button type="primary"> <OrderedListOutlined /> Groceries</a-button>
				</router-link>
			</div>
		</div>
		<div v-else>
			<a-spin size="large" />
		</div>
	</div>
</template>

<script setup lang="ts">
import { OrderedListOutlined, EuroCircleOutlined } from '@ant-design/icons-vue';
import Avatar from '../components/Avatar.vue';
import Version from '../components/Version.vue';
import { FamilyPageName, GroceriesPageName, LoginPageName } from '../router';
import { isAdmin, isLoggedIn } from '../services/utils';
</script>
