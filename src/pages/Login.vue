<template>
	<div class="flex-center full-height" style="padding: 20px">
		<div v-if="isLoggedIn">
			<p>You are logged as: {{ useUserStore().user?.displayName }}</p>
			<router-link to="/">
				<a-button>Home</a-button>
			</router-link>
		</div>
		<div v-else>
			<h2>It seems like I don't recongnize you...</h2>
			<p>Please, login with Google to access private areas of this app.</p>
			<a-button type="primary" @click="FirebaseAuth.signInWithGoogle"
				>Sign in with <GoogleOutlined
			/></a-button>
		</div>
	</div>
</template>

<script lang="ts" setup>
import { GoogleOutlined } from '@ant-design/icons-vue';
import { FirebaseAuth } from '../api/auth';
import { isLoggedIn } from '../services/utils';
import { useUserStore } from '../stores/user';
</script>

<style lang="scss" scoped></style>
