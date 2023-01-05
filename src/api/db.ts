import { User } from 'firebase/auth';
import {
	addDoc,
	collection,
	getDocs,
	getFirestore,
	query,
	setDoc,
	where,
} from 'firebase/firestore';
import { doc, getDoc } from 'firebase/firestore';

import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { ITransaction } from '../models/transaction';
import { ICategory } from '../models/category';

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

export interface IResult<T> {
	id: string;
	data: T;
}

const db = getFirestore();

export const DataBaseClient = {
	User: {
		async getUser(uid: string): Promise<User | null> {
			const docRef = doc(db, 'users', uid);
			const docSnap = await getDoc(docRef);

			if (docSnap.exists()) return docSnap.data() as User;
			else return null;
		},
		async getUserOrCreateOne(firebaseUser: User): Promise<User> {
			const docRef = doc(db, 'users', firebaseUser.uid);
			const docSnap = await getDoc(docRef);

			if (docSnap.exists()) return docSnap.data() as User;
			else return this.createNewUser(firebaseUser);
		},
		async createNewUser(firebaseUser: User): Promise<User> {
			await setDoc(doc(collection(db, 'users'), firebaseUser.uid), firebaseUser);
			return firebaseUser;
		},
		async getAllUsers(): Promise<User[]> {
			const querySnapshot = await getDocs(collection(db, 'users'));
			return querySnapshot.docs.map(doc => doc.data()) as User[];
		},
	},
	Transaction: {
		async getTransactions(type: 'expense' | 'earning'): Promise<IResult<ITransaction>[]> {
			const q = query(collection(db, 'transactions'), where('type', '==', type));
			const querySnapshot = await getDocs(q);
			return querySnapshot.docs.map(doc => ({
				id: doc.id,
				data: doc.data(),
			})) as IResult<ITransaction>[];
		},
		async createNewTransaction(transaction: ITransaction): Promise<boolean> {
			try {
				await addDoc(
					collection(db, 'transactions'),
					JSON.parse(JSON.stringify(transaction))
				);
				return true;
			} catch (err) {
				console.error(err);
				throw err;
			}
		},
	},
	Category: {
		async getAll(type: 'expense' | 'earning'): Promise<IResult<ICategory>[]> {
			const q = query(collection(db, 'categories'), where('type', '==', type));
			const querySnapshot = await getDocs(q);
			return querySnapshot.docs.map(doc => ({
				id: doc.id,
				data: doc.data(),
			})) as IResult<ICategory>[];
		},
		async createNewCategory(category: ICategory): Promise<boolean> {
			try {
				await addDoc(collection(db, 'categories'), JSON.parse(JSON.stringify(category)));
				return true;
			} catch (err) {
				console.error(err);
				throw err;
			}
		},
	},
};
