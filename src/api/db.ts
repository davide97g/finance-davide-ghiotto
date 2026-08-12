import type { User } from "firebase/auth";
import {
	collection,
	deleteDoc,
	doc,
	getDoc,
	getDocs,
	initializeFirestore,
	onSnapshot,
	persistentLocalCache,
	persistentMultipleTabManager,
	query,
	setDoc,
	type Unsubscribe,
	where,
} from "firebase/firestore";
import type { Category, CategoryType, ICategory } from "../models/category";
import type { CategoryUsageData } from "../models/categoryUsage";
import type { Grocery, IGrocery } from "../models/grocery";
import type { IRecurring, Recurring } from "../models/recurring";
import type { IStats, Stats } from "../models/stats";
import type { ITag, Tag } from "../models/tag";
import type { ITodo, Todo } from "../models/todo";
import type { ITransaction, Transaction } from "../models/transaction";
import { setIsLoading } from "../stores/loading";
import { nextListenerId, trackWrite, useSyncStore } from "../stores/sync";
import { firebaseApp } from "./auth";

/**
 * Offline-first Firestore: reads fall back to the IndexedDB cache when the
 * network is down and writes are queued there until it is back. The multi-tab
 * manager keeps that cache consistent when the app is open more than once.
 */
const db = initializeFirestore(firebaseApp, {
	localCache: persistentLocalCache({
		tabManager: persistentMultipleTabManager(),
	}),
});

/**
 * Writes below are fired without awaiting the server ack: offline that ack
 * never arrives, so awaiting it would hang the UI. Firestore applies every
 * write to the local cache immediately (and real-time listeners echo it right
 * away), while `trackWrite` keeps the sync indicator honest until the server
 * confirms.
 */
export const DataBaseClient = {
	User: {
		async getUser(uid: string): Promise<User | null> {
			const docRef = doc(db, "users", uid);
			const docSnap = await getDoc(docRef);

			if (docSnap.exists()) return docSnap.data() as User;
			else return null;
		},
		async getUserOrCreateOne(firebaseUser: User): Promise<User> {
			const docRef = doc(db, "users", firebaseUser.uid);
			const docSnap = await getDoc(docRef);

			if (docSnap.exists()) return docSnap.data() as User;
			else return this.createNewUser(firebaseUser);
		},
		async createNewUser(firebaseUser: User): Promise<User> {
			trackWrite(
				setDoc(doc(collection(db, "users"), firebaseUser.uid), firebaseUser),
				"user create",
			);
			return firebaseUser;
		},
		async getAllUsers(): Promise<User[]> {
			const querySnapshot = await getDocs(collection(db, "users"));
			return querySnapshot.docs.map((doc) => doc.data()) as User[];
		},
	},
	Transaction: {
		collection: "transactions",
		async get(filters?: {
			type?: "expense" | "earning";
			month?: string;
			year?: string;
		}): Promise<Transaction[]> {
			setIsLoading(true);
			const constraints = [];
			if (filters?.type) constraints.push(where("type", "==", filters.type));
			if (filters?.month) constraints.push(where("month", "==", filters.month));
			if (filters?.year) constraints.push(where("year", "==", filters.year));
			const q = query(collection(db, this.collection), ...constraints);
			try {
				const querySnapshot = await getDocs(q);
				return querySnapshot.docs.map((doc) => ({
					id: doc.id,
					...doc.data(),
				})) as Transaction[];
			} finally {
				setIsLoading(false);
			}
		},
		async getRT(
			callback: (transactions: Transaction[]) => void,
			filters?: {
				type?: "expense" | "earning";
				month?: string;
				year?: string;
			},
		): Promise<Unsubscribe> {
			const constraints = [];
			if (filters?.type) constraints.push(where("type", "==", filters.type));
			if (filters?.month) constraints.push(where("month", "==", filters.month));
			if (filters?.year) constraints.push(where("year", "==", filters.year));
			const q = query(collection(db, this.collection), ...constraints);
			const listenerId = nextListenerId();
			// Metadata changes carry `hasPendingWrites`, which flips back to false
			// once the server acks. Without them the "waiting to sync" badge on a
			// row would never clear on its own.
			const unsubscribe = onSnapshot(
				q,
				{ includeMetadataChanges: true },
				(querySnapshot) => {
					const transactions = querySnapshot.docs.map((doc) => ({
						id: doc.id,
						...doc.data(),
						pending: doc.metadata.hasPendingWrites,
					})) as Transaction[];
					useSyncStore
						.getState()
						.setPendingDocs(
							listenerId,
							transactions.filter((t) => t.pending).length,
						);
					callback(transactions);
				},
			);
			return () => {
				useSyncStore.getState().clearListener(listenerId);
				unsubscribe();
			};
		},
		async create(transaction: ITransaction): Promise<Transaction> {
			const createdAt = Date.now();
			const payload = {
				...JSON.parse(JSON.stringify(transaction)),
				createdAt,
			};
			// The id is generated client-side, so the new row is usable offline.
			const ref = doc(collection(db, this.collection));
			trackWrite(setDoc(ref, payload), "transaction create");
			return {
				id: ref.id,
				...transaction,
				createdAt,
			};
		},
		async update(transaction: Transaction): Promise<boolean> {
			// `pending` is a client-side sync flag, never part of the stored doc.
			const { pending: _pending, ...payload } = transaction;
			trackWrite(
				setDoc(
					doc(collection(db, this.collection), transaction.id),
					JSON.parse(JSON.stringify(payload)),
					{ merge: true },
				),
				"transaction update",
			);
			return true;
		},
		async delete(transactionId: string): Promise<boolean> {
			trackWrite(
				deleteDoc(doc(collection(db, this.collection), transactionId)),
				"transaction delete",
			);
			return true;
		},
		async bulkAdd(transactions: ITransaction[]): Promise<Transaction[]> {
			const transactionsCreation: Promise<Transaction>[] = [];
			transactions.forEach((transaction) =>
				transactionsCreation.push(this.create(transaction)),
			);
			return await Promise.all(transactionsCreation);
		},
	},
	Category: {
		collection: "categories",
		async get(type?: CategoryType): Promise<Category[]> {
			const constraints = [];
			if (type) constraints.push(where("type", "==", type));
			const q = query(collection(db, this.collection), ...constraints);
			const querySnapshot = await getDocs(q);
			return querySnapshot.docs.map((doc) => ({
				id: doc.id,
				...doc.data(),
			})) as Category[];
		},
		async create(iCategory: ICategory): Promise<Category> {
			const ref = doc(collection(db, this.collection));
			trackWrite(
				setDoc(ref, JSON.parse(JSON.stringify(iCategory))),
				"category create",
			);
			return {
				id: ref.id,
				...iCategory,
			};
		},
		async update(category: Category): Promise<boolean> {
			trackWrite(
				setDoc(
					doc(collection(db, this.collection), category.id),
					JSON.parse(JSON.stringify(category)),
					{ merge: true },
				),
				"category update",
			);
			return true;
		},
		async delete(categoryId: string): Promise<boolean> {
			trackWrite(
				deleteDoc(doc(collection(db, this.collection), categoryId)),
				"category delete",
			);
			return true;
		},
	},
	Tag: {
		collection: "tags",
		async get(): Promise<Tag[]> {
			const querySnapshot = await getDocs(collection(db, this.collection));
			return querySnapshot.docs.map((doc) => ({
				id: doc.id,
				...doc.data(),
			})) as Tag[];
		},
		async create(iTag: ITag): Promise<Tag> {
			const ref = doc(collection(db, this.collection));
			trackWrite(setDoc(ref, JSON.parse(JSON.stringify(iTag))), "tag create");
			return {
				id: ref.id,
				...iTag,
			};
		},
		async update(tag: Tag): Promise<boolean> {
			trackWrite(
				setDoc(
					doc(collection(db, this.collection), tag.id),
					JSON.parse(JSON.stringify(tag)),
					{ merge: true },
				),
				"tag update",
			);
			return true;
		},
		async delete(tagId: string): Promise<boolean> {
			trackWrite(
				deleteDoc(doc(collection(db, this.collection), tagId)),
				"tag delete",
			);
			return true;
		},
	},
	Recurring: {
		collection: "recurring",
		async get(): Promise<Recurring[]> {
			const querySnapshot = await getDocs(collection(db, this.collection));
			return querySnapshot.docs.map((doc) => ({
				id: doc.id,
				...doc.data(),
			})) as Recurring[];
		},
		async create(iRecurring: IRecurring): Promise<Recurring> {
			const payload = {
				...JSON.parse(JSON.stringify(iRecurring)),
				createdAt: Date.now(),
			};
			const ref = doc(collection(db, this.collection));
			trackWrite(setDoc(ref, payload), "recurring create");
			return {
				id: ref.id,
				...payload,
			};
		},
		async update(recurring: Recurring): Promise<boolean> {
			trackWrite(
				setDoc(
					doc(collection(db, this.collection), recurring.id),
					JSON.parse(JSON.stringify(recurring)),
					{ merge: true },
				),
				"recurring update",
			);
			return true;
		},
		async delete(recurringId: string): Promise<boolean> {
			trackWrite(
				deleteDoc(doc(collection(db, this.collection), recurringId)),
				"recurring delete",
			);
			return true;
		},
	},
	Stats: {
		collection: "stats",
		async get(month: string, year: string): Promise<Stats> {
			const q = query(
				collection(db, this.collection),
				where("month", "==", month),
				where("year", "==", year),
			);
			const querySnapshot = await getDocs(q);
			return querySnapshot.docs.map((doc) => ({
				id: doc.id,
				...doc.data(),
			}))[0] as Stats;
		},
		async getByYear(year: string): Promise<Stats[]> {
			const q = query(
				collection(db, this.collection),
				where("year", "==", year),
			);
			const querySnapshot = await getDocs(q);
			return querySnapshot.docs.map((doc) => ({
				id: doc.id,
				...doc.data(),
			})) as Stats[];
		},
		async getAllYears(): Promise<Stats[]> {
			const querySnapshot = await getDocs(collection(db, this.collection));
			return querySnapshot.docs.map((doc) => ({
				id: doc.id,
				...doc.data(),
			})) as Stats[];
		},
		async create(iStats: IStats): Promise<Stats> {
			const ref = doc(collection(db, this.collection));
			trackWrite(
				setDoc(ref, JSON.parse(JSON.stringify(iStats))),
				"stats create",
			);
			return {
				id: ref.id,
				...iStats,
			};
		},
		async update(stats: Stats): Promise<boolean> {
			trackWrite(
				setDoc(
					doc(collection(db, this.collection), stats.id),
					JSON.parse(JSON.stringify(stats)),
					{ merge: true },
				),
				"stats update",
			);
			return true;
		},
		async delete(statsId: string): Promise<boolean> {
			trackWrite(
				deleteDoc(doc(collection(db, this.collection), statsId)),
				"stats delete",
			);
			return true;
		},
		async bulkDelete(statsIds: string[]): Promise<boolean> {
			const statsDeletion: Promise<boolean>[] = [];
			statsIds.forEach((statsId) => statsDeletion.push(this.delete(statsId)));
			await Promise.all(statsDeletion);
			return true;
		},
		async bulkAdd(stats: IStats[]): Promise<Stats[]> {
			const statsCreation: Promise<Stats>[] = [];
			stats.forEach((stat) => statsCreation.push(this.create(stat)));
			const result = await Promise.all(statsCreation);
			return result;
		},
	},
	Grocery: {
		collection: "groceries",
		async get(): Promise<Grocery[]> {
			setIsLoading(true);
			try {
				const querySnapshot = await getDocs(collection(db, this.collection));
				return querySnapshot.docs.map((doc) => ({
					id: doc.id,
					...doc.data(),
				})) as Grocery[];
			} finally {
				setIsLoading(false);
			}
		},
		async getRT(
			callback: (groceries: Grocery[]) => void,
		): Promise<Unsubscribe> {
			return onSnapshot(collection(db, this.collection), (querySnapshot) => {
				const groceries = querySnapshot.docs.map((doc) => ({
					id: doc.id,
					...doc.data(),
				})) as Grocery[];
				callback(groceries);
			});
		},
		async create(grocery: IGrocery): Promise<Grocery> {
			const ref = doc(collection(db, this.collection));
			trackWrite(
				setDoc(ref, JSON.parse(JSON.stringify(grocery))),
				"grocery create",
			);
			return {
				id: ref.id,
				...grocery,
			};
		},
		async update(grocery: Grocery): Promise<boolean> {
			trackWrite(
				setDoc(
					doc(collection(db, this.collection), grocery.id),
					JSON.parse(JSON.stringify(grocery)),
					{ merge: true },
				),
				"grocery update",
			);
			return true;
		},
		async delete(groceryId: string): Promise<boolean> {
			trackWrite(
				deleteDoc(doc(collection(db, this.collection), groceryId)),
				"grocery delete",
			);
			return true;
		},
	},
	Todo: {
		collection: "todo",
		async get(): Promise<Todo[]> {
			setIsLoading(true);
			try {
				const querySnapshot = await getDocs(collection(db, this.collection));
				return querySnapshot.docs.map((doc) => ({
					id: doc.id,
					...doc.data(),
				})) as Todo[];
			} finally {
				setIsLoading(false);
			}
		},
		async getRT(callback: (todos: Todo[]) => void): Promise<Unsubscribe> {
			return onSnapshot(collection(db, this.collection), (querySnapshot) => {
				const todos = querySnapshot.docs.map((doc) => ({
					id: doc.id,
					...doc.data(),
				})) as Todo[];
				callback(todos);
			});
		},
		async create(todo: ITodo): Promise<Todo> {
			const ref = doc(collection(db, this.collection));
			trackWrite(setDoc(ref, JSON.parse(JSON.stringify(todo))), "todo create");
			return {
				id: ref.id,
				...todo,
			};
		},
		async update(todo: Todo): Promise<boolean> {
			trackWrite(
				setDoc(
					doc(collection(db, this.collection), todo.id),
					JSON.parse(JSON.stringify(todo)),
					{ merge: true },
				),
				"todo update",
			);
			return true;
		},
		async delete(todoId: string): Promise<boolean> {
			trackWrite(
				deleteDoc(doc(collection(db, this.collection), todoId)),
				"todo delete",
			);
			return true;
		},
	},
	CategoryUsage: {
		async get(): Promise<CategoryUsageData | null> {
			const docSnap = await getDoc(doc(db, "settings", "categoryUsage"));
			if (docSnap.exists()) return docSnap.data() as CategoryUsageData;
			return null;
		},
		async set(data: CategoryUsageData): Promise<void> {
			trackWrite(
				setDoc(doc(db, "settings", "categoryUsage"), data),
				"category usage set",
			);
		},
	},
};
