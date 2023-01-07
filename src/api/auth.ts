import {
	getAuth,
	signInWithPopup,
	GoogleAuthProvider,
	signOut,
	onAuthStateChanged,
} from 'firebase/auth';
import { useUserStore } from '../stores/user';
import { HomePageName, router } from '../router';
import { setIsLoading } from '../services/utils';

import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';

const firebaseConfig = {
	apiKey: 'AIzaSyAJxoJsYk8XAyFwxMk8fCmh2F8IaCxncg0',
	authDomain: 'test-davide-ghiotto.firebaseapp.com',
	projectId: 'test-davide-ghiotto',
	storageBucket: 'test-davide-ghiotto.appspot.com',
	messagingSenderId: '507675193838',
	appId: '1:507675193838:web:0ad24c3dd4afea80545eff',
	measurementId: 'G-4T0KJZ8R1K',
};

const app = initializeApp(firebaseConfig);
getAnalytics(app);

const provider = new GoogleAuthProvider();
const auth = getAuth();

export const checkUserIsLoggedIn = () => {
	return new Promise((resolve, reject) => {
		setIsLoading(true);
		onAuthStateChanged(
			auth,
			async user => {
				setIsLoading(false);
				if (user) {
					useUserStore().setUser(user);
					resolve(user);
				} else reject(false);
			},
			err => {
				useUserStore().setUser(null);
				setIsLoading(false);
				reject(err);
			}
		);
	});
};

export const FirebaseAuth = {
	signInWithGoogle: () =>
		signInWithPopup(auth, provider)
			.then(result => GoogleAuthProvider.credentialFromResult(result))
			.catch(() => {
				useUserStore().setUser(null);
				return null;
			}),

	signOut: () => {
		signOut(auth).then(() => {
			router.push({ name: HomePageName });
			useUserStore().setUser(null);
		});
	},
};
