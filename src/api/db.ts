import { User } from 'firebase/auth';
import {
	addDoc,
	collection,
	deleteDoc,
	getDocs,
	getFirestore,
	query,
	setDoc,
	where,
} from 'firebase/firestore';
import { doc, getDoc } from 'firebase/firestore';
import { ITransaction, Transaction } from '../models/transaction';
import { Category, ICategory } from '../models/category';
import { INail, Nail } from '../models/nail';

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
		collection: 'transactions',
		async getTransactions(type?: 'expense' | 'earning'): Promise<Transaction[]> {
			if (!type) {
				const querySnapshot = await getDocs(collection(db, this.collection));
				return querySnapshot.docs.map(doc => ({
					id: doc.id,
					...doc.data(),
				})) as Transaction[];
			} else {
				const q = query(collection(db, this.collection), where('type', '==', type));
				const querySnapshot = await getDocs(q);
				return querySnapshot.docs.map(doc => ({
					id: doc.id,
					...doc.data(),
				})) as Transaction[];
			}
		},
		async createNewTransaction(transaction: ITransaction): Promise<Transaction> {
			try {
				const res = await addDoc(
					collection(db, this.collection),
					JSON.parse(JSON.stringify(transaction))
				);
				return {
					id: res.id,
					...transaction,
				};
			} catch (err) {
				console.error(err);
				throw err;
			}
		},
		async updateTransaction(transaction: Transaction): Promise<boolean> {
			try {
				await setDoc(
					doc(collection(db, this.collection), transaction.id),
					JSON.parse(JSON.stringify(transaction)),
					{
						merge: true,
					}
				);
				return true;
			} catch (err) {
				console.error(err);
				throw err;
			}
		},
		async deleteTransaction(transactionId: string): Promise<boolean> {
			try {
				await deleteDoc(doc(collection(db, this.collection), transactionId));
				return true;
			} catch (err) {
				console.error(err);
				throw err;
			}
		},
	},
	Category: {
		collection: 'categories',
		async getAll(type?: 'expense' | 'earning'): Promise<Category[]> {
			if (type) {
				const q = query(collection(db, this.collection), where('type', '==', type));
				const querySnapshot = await getDocs(q);
				return querySnapshot.docs.map(doc => ({
					id: doc.id,
					...doc.data(),
				})) as Category[];
			} else {
				const querySnapshot = await getDocs(collection(db, this.collection));
				return querySnapshot.docs.map(doc => ({
					id: doc.id,
					...doc.data(),
				})) as Category[];
			}
		},
		async createNewCategory(iCategory: ICategory): Promise<Category> {
			try {
				const res = await addDoc(
					collection(db, this.collection),
					JSON.parse(JSON.stringify(iCategory))
				);
				return {
					id: res.id,
					...iCategory,
				};
			} catch (err) {
				console.error(err);
				throw err;
			}
		},
		async updateCategory(category: Category): Promise<boolean> {
			try {
				await setDoc(
					doc(collection(db, this.collection), category.id),
					JSON.parse(JSON.stringify(category)),
					{
						merge: true,
					}
				);
				return true;
			} catch (err) {
				console.error(err);
				throw err;
			}
		},
		async deleteCategory(categoryId: string): Promise<boolean> {
			try {
				await deleteDoc(doc(collection(db, this.collection), categoryId));
				return true;
			} catch (err) {
				console.error(err);
				throw err;
			}
		},
	},
	Nail: {
		collection: 'nails',
		async get(month: string, year: string): Promise<Nail[]> {
			const q = query(
				collection(db, this.collection),
				where('month', '==', month),
				where('year', '==', year)
			);

			const querySnapshot = await getDocs(q);
			return querySnapshot.docs.map(doc => ({
				id: doc.id,
				...doc.data(),
			})) as Nail[];
		},
		async getAll(): Promise<Nail[]> {
			const querySnapshot = await getDocs(collection(db, this.collection));
			return querySnapshot.docs.map(doc => ({
				id: doc.id,
				...doc.data(),
			})) as Nail[];
		},
		async createNewNail(iNail: INail): Promise<Nail> {
			try {
				const res = await addDoc(
					collection(db, this.collection),
					JSON.parse(JSON.stringify(iNail))
				);
				return {
					id: res.id,
					...iNail,
				};
			} catch (err) {
				console.error(err);
				throw err;
			}
		},
		async updateNail(nail: Nail): Promise<boolean> {
			try {
				await setDoc(
					doc(collection(db, this.collection), nail.id),
					JSON.parse(JSON.stringify(nail)),
					{
						merge: true,
					}
				);
				return true;
			} catch (err) {
				console.error(err);
				throw err;
			}
		},
		async deleteNail(nailId: string): Promise<boolean> {
			try {
				await deleteDoc(doc(collection(db, this.collection), nailId));
				return true;
			} catch (err) {
				console.error(err);
				throw err;
			}
		},
	},
};
