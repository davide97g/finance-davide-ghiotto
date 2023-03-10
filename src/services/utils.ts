import { User } from 'firebase/auth';
import { computed, ref } from 'vue';
import { useUserStore } from '../stores/user';
import { notification } from 'ant-design-vue';

const windowWidth = ref(window.innerWidth);
window.addEventListener('resize', () => (windowWidth.value = window.innerWidth));

const isLoading = ref(true);

export const setIsLoading = (loading: boolean) => (isLoading.value = loading);

export const loading = computed(() => isLoading.value);
export const isMobile = computed(() => windowWidth.value < 600);

export const getPhotoURL = (user: User | null) => {
	return new URL(user?.photoURL || '../assets/img/default-profile-pic.svg', import.meta.url).href;
};

export const isLoggedIn = computed(() => useUserStore().isLoggedIn);
export const isAdmin = computed(() => useUserStore().isAdmin);

export const formatDate = (date: string) => {
	var d = new Date(date),
		month = '' + (d.getMonth() + 1),
		day = '' + d.getDate(),
		year = d.getFullYear();

	if (month.length < 2) month = '0' + month;
	if (day.length < 2) day = '0' + day;

	return [year, month, day].join('-');
};

export const openNotificationWithIcon = (type: string, message: string, description?: string) => {
	(notification as any)[type]({
		message,
		description,
		duration: 2,
	});
};

export function clone<T>(object: T): T {
	return JSON.parse(JSON.stringify(object || {}));
}
export function equals<T>(obj1: T, obj2: T): boolean {
	return JSON.stringify(obj1) === JSON.stringify(obj2);
}

export const YEARS = ['2022', '2023'];
export const MONTHS = [
	'January',
	'February',
	'March',
	'April',
	'May',
	'June',
	'July',
	'August',
	'September',
	'October',
	'November',
	'December',
];
