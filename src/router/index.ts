import {
	createRouter,
	createWebHistory,
	NavigationGuardNext,
	RouteLocationNormalized,
} from 'vue-router';
import { checkUserIsLoggedIn } from '../api/auth';
import { useUserStore } from '../stores/user';

export const HomePageName = 'Home';
export const LoginPageName = 'Login';
export const ProfilePageName = 'Profile';
export const FamilyPageName = 'Family';
export const GroceriesPageName = 'Groceries';

const loggedInGuard = async (
	to: RouteLocationNormalized,
	from: RouteLocationNormalized,
	next: NavigationGuardNext
) => {
	try {
		const userStore = useUserStore();
		await checkUserIsLoggedIn();
		if (to.name != LoginPageName && !userStore.isLoggedIn) next({ name: LoginPageName });
		else next();
	} catch (err) {
		console.error(err);
		next({ name: LoginPageName });
	}
};

const routes = [
	{
		path: '/',
		name: HomePageName,
		component: () => import('../pages/Home.vue'),
	},
	{
		path: '/login',
		name: LoginPageName,
		component: () => import('../pages/Login.vue'),
	},
	{
		path: '/profile',
		name: ProfilePageName,
		component: () => import('../pages/Profile.vue'),
		beforeEnter: loggedInGuard,
	},
	{
		path: '/family',
		name: FamilyPageName,
		component: () => import('../pages/Family.vue'),
		beforeEnter: loggedInGuard,
	},
	{
		path: '/groceries',
		name: GroceriesPageName,
		component: () => import('../pages/Groceries.vue'),
		beforeEnter: loggedInGuard,
	},
	{ path: '/:pathMatch(.*)*', redirect: '/' },
];

export const router = createRouter({
	history: createWebHistory(),
	routes,
});
