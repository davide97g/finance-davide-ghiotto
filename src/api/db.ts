import { User } from 'firebase/auth';
import {
	addDoc,
	collection,
	deleteDoc,
	getDocs,
	getFirestore,
	onSnapshot,
	query,
	setDoc,
	Unsubscribe,
	where,
} from 'firebase/firestore';
import { doc, getDoc, enableIndexedDbPersistence } from 'firebase/firestore';
import { ITransaction, Transaction } from '../models/transaction';
import { Category, CategoryType, ICategory } from '../models/category';
import { IStats, Stats } from '../models/stats';
import { ITag, Tag } from '../models/tag';

const db = getFirestore();

enableIndexedDbPersistence(db).catch(err => {
	if (err.code == 'failed-precondition') {
		console.info('offline init failed');
	} else if (err.code == 'unimplemented') {
		console.info('offline not supported');
	}
});

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
		async get(filters?: {
			type?: 'expense' | 'earning';
			month?: string;
			year?: string;
		}): Promise<Transaction[]> {
			const constraints = [];
			if (filters?.type) constraints.push(where('type', '==', filters.type));
			if (filters?.month) constraints.push(where('month', '==', filters.month));
			if (filters?.year) constraints.push(where('year', '==', filters.year));
			const q = query(collection(db, this.collection), ...constraints);
			const querySnapshot = await getDocs(q);
			return querySnapshot.docs.map(doc => ({
				id: doc.id,
				...doc.data(),
			})) as Transaction[];
		},
		async getRT(
			callback: (transactions: Transaction[]) => void,
			filters?: {
				type?: 'expense' | 'earning';
				month?: string;
				year?: string;
			}
		): Promise<Unsubscribe> {
			const constraints = [];
			if (filters?.type) constraints.push(where('type', '==', filters.type));
			if (filters?.month) constraints.push(where('month', '==', filters.month));
			if (filters?.year) constraints.push(where('year', '==', filters.year));
			const q = query(collection(db, this.collection), ...constraints);
			return onSnapshot(q, querySnapshot => {
				const transactions = querySnapshot.docs.map(doc => ({
					id: doc.id,
					...doc.data(),
				})) as Transaction[];
				callback(transactions);
			});
		},
		async create(transaction: ITransaction): Promise<Transaction> {
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
		async update(transaction: Transaction): Promise<boolean> {
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
		async delete(transactionId: string): Promise<boolean> {
			try {
				await deleteDoc(doc(collection(db, this.collection), transactionId));
				return true;
			} catch (err) {
				console.error(err);
				throw err;
			}
		},
		async bulkAdd(transactions: ITransaction[]): Promise<Transaction[]> {
			try {
				const transactionsCreation: Promise<Transaction>[] = [];
				transactions.forEach(transaction =>
					transactionsCreation.push(this.create(transaction))
				);
				return await Promise.all(transactionsCreation);
			} catch (err) {
				console.error(err);
				throw err;
			}
		},
	},
	Category: {
		collection: 'categories',
		async get(type?: CategoryType): Promise<Category[]> {
			const constraints = [];
			if (type) constraints.push(where('type', '==', type));
			const q = query(collection(db, this.collection), ...constraints);
			const querySnapshot = await getDocs(q);
			return querySnapshot.docs.map(doc => ({
				id: doc.id,
				...doc.data(),
			})) as Category[];
		},
		async create(iCategory: ICategory): Promise<Category> {
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
		async update(category: Category): Promise<boolean> {
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
		async delete(categoryId: string): Promise<boolean> {
			try {
				await deleteDoc(doc(collection(db, this.collection), categoryId));
				return true;
			} catch (err) {
				console.error(err);
				throw err;
			}
		},
	},
	Tag: {
		collection: 'tags',
		async get(): Promise<Tag[]> {
			const querySnapshot = await getDocs(collection(db, this.collection));
			return querySnapshot.docs.map(doc => ({
				id: doc.id,
				...doc.data(),
			})) as Category[];
		},
		async create(iTag: ITag): Promise<Tag> {
			try {
				const res = await addDoc(
					collection(db, this.collection),
					JSON.parse(JSON.stringify(iTag))
				);
				return {
					id: res.id,
					...iTag,
				};
			} catch (err) {
				console.error(err);
				throw err;
			}
		},
		async update(tag: Tag): Promise<boolean> {
			try {
				await setDoc(
					doc(collection(db, this.collection), tag.id),
					JSON.parse(JSON.stringify(tag)),
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
		async delete(tagId: string): Promise<boolean> {
			try {
				await deleteDoc(doc(collection(db, this.collection), tagId));
				return true;
			} catch (err) {
				console.error(err);
				throw err;
			}
		},
	},
	Stats: {
		collection: 'stats',
		async get(month: string, year: string): Promise<Stats> {
			const q = query(
				collection(db, this.collection),
				where('month', '==', month),
				where('year', '==', year)
			);
			const querySnapshot = await getDocs(q);
			return querySnapshot.docs.map(doc => ({
				id: doc.id,
				...doc.data(),
			}))[0] as Stats;
		},
		async getByYear(year: string): Promise<Stats[]> {
			const q = query(collection(db, this.collection), where('year', '==', year));
			const querySnapshot = await getDocs(q);
			return querySnapshot.docs.map(doc => ({
				id: doc.id,
				...doc.data(),
			})) as Stats[];
		},
		async create(iStats: IStats): Promise<Stats> {
			try {
				const res = await addDoc(
					collection(db, this.collection),
					JSON.parse(JSON.stringify(iStats))
				);
				return {
					id: res.id,
					...iStats,
				};
			} catch (err) {
				console.error(err);
				throw err;
			}
		},
		async update(stats: Stats): Promise<boolean> {
			try {
				await setDoc(
					doc(collection(db, this.collection), stats.id),
					JSON.parse(JSON.stringify(stats)),
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
		async delete(statsId: string): Promise<boolean> {
			let document;
			try {
				document = doc(collection(db, this.collection), statsId);
			} catch (err) {
				console.error(err);
				throw err;
			}
			try {
				await deleteDoc(document);
				return true;
			} catch (err) {
				console.error(err);
				throw err;
			}
		},
		async bulkDelete(statsIds: string[]): Promise<boolean> {
			try {
				const statsDeletion: Promise<boolean>[] = [];
				statsIds.forEach(statsId => statsDeletion.push(this.delete(statsId)));
				await Promise.all(statsDeletion);
				return true;
			} catch (err) {
				console.error(err);
				throw err;
			}
		},
		async bulkAdd(stats: IStats[]): Promise<Stats[]> {
			try {
				const statsCreation: Promise<Stats>[] = [];
				stats.forEach(stat => statsCreation.push(this.create(stat)));
				const result = await Promise.all(statsCreation);
				return result;
			} catch (err) {
				throw err;
			}
		},
	},
};
