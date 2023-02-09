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
					<a-button type="primary"> <HomeOutlined /> Family Balance</a-button>
				</router-link>
				<router-link :to="{ name: PivaPageName }">
					<a-button type="primary"><EuroCircleTwoTone /> Kristina Piva</a-button>
				</router-link>
				<router-link :to="{ name: InvestmentPageName }" class="m1">
					<a-button type="primary"> <MoneyCollectFilled /> Investments</a-button>
				</router-link>
			</div>
		</div>
		<div v-else>
			<a-spin size="large" />
		</div>
		<Footer />
	</div>
</template>

<script setup lang="ts">
import { HomeOutlined, EuroCircleTwoTone, MoneyCollectFilled } from '@ant-design/icons-vue';
import Avatar from '../components/Avatar.vue';
import Footer from '../components/Footer.vue';
import { FamilyPageName, LoginPageName, PivaPageName, InvestmentPageName } from '../router';
import { isAdmin, isLoggedIn } from '../services/utils';
</script>
