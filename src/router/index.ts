import { createRouter, createWebHistory } from 'vue-router';

export const router = createRouter({
	history: createWebHistory(),
	routes: [
		{
			path: '/',
			component: () => import('../pages/Home.vue'),
		},
		{
			path: '/family',
			component: () => import('../pages/Family.vue'),
		},
		{ path: '/:pathMatch(.*)*', redirect: '/' },
	],
});
