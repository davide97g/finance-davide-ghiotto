import { getAnalytics } from "firebase/analytics";
import { initializeApp } from "firebase/app";
import {
	GoogleAuthProvider,
	getAuth,
	onAuthStateChanged,
	signInWithPopup,
	signOut,
} from "firebase/auth";
import { setIsLoading } from "../services/utils";
import { useUserStore } from "../stores/user";

const firebaseConfig = {
	apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
	authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
	projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
	storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
	messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
	appId: import.meta.env.VITE_FIREBASE_APP_ID,
	measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
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
			async (user) => {
				setIsLoading(false);
				if (user) {
					useUserStore.getState().setUser(user);
					resolve(user);
				} else {
					useUserStore.getState().setUser(null);
					reject(new Error("User not logged in"));
				}
			},
			(err) => {
				useUserStore.getState().setUser(null);
				setIsLoading(false);
				reject(err);
			},
		);
	});
};

export const FirebaseAuth = {
	signInWithGoogle: () =>
		signInWithPopup(auth, provider)
			.then((result) => GoogleAuthProvider.credentialFromResult(result))
			.catch(() => {
				useUserStore.getState().setUser(null);
				return null;
			}),

	signOut: () => {
		signOut(auth).then(() => {
			window.location.href = "/";
			useUserStore.getState().setUser(null);
		});
	},
};
