/**
 * Loads a Firestore dump (produced by `scripts/export-firestore.ts`) into
 * Postgres.
 *
 * The import is idempotent: every row is upserted by its original Firestore
 * id, so re-running it after a fresh export re-syncs the replica without
 * duplicating anything. Rows that cannot satisfy the new constraints are
 * reported instead of silently dropped.
 *
 * Usage:
 *   bun run import                    # uses backup/latest.json
 *   bun run import -- <backup-dir>    # a specific dump directory
 *   bun run import -- --allow-orphans # park dangling references on a placeholder category
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { sql as drizzleSql } from "drizzle-orm";
import { db, sql } from "../db/client";
import {
	categories,
	groceries,
	recurring,
	settings,
	statsCategories,
	stats,
	tags,
	todos,
	transactions,
	users,
} from "../db/schema";

/**
 * `excluded.<column>` inside an upsert: "keep what the dump says". Typed as
 * never so it slots into any column of a drizzle `set` clause.
 */
const sqlExcluded = (column: string) =>
	drizzleSql.raw(`excluded."${column}"`) as never;

const args = process.argv.slice(2);
const allowOrphans = args.includes("--allow-orphans");
const explicitDir = args.find((arg) => !arg.startsWith("--"));

const backupRoot = join(import.meta.dir, "..", "..", "..", "backup");
const dir =
	explicitDir ??
	join(
		backupRoot,
		JSON.parse(readFileSync(join(backupRoot, "latest.json"), "utf8")).dir,
	);

/** Category every orphaned reference is parked on, created only when needed. */
const ORPHAN_CATEGORY_ID = "migrated-unknown";

const read = <T>(name: string): T[] => {
	try {
		return JSON.parse(readFileSync(join(dir, `${name}.json`), "utf8"));
	} catch {
		console.warn(`no ${name}.json in the dump, skipping`);
		return [];
	}
};

const problems: string[] = [];
let emptyDocs = 0;
const isoDate = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Firestore accumulated documents holding nothing but their id (2612 exported
 * transactions included 178 of them). They carry no data to migrate, so they
 * are counted, not reported field by field.
 */
const isEmpty = (doc: Record<string, unknown>) => Object.keys(doc).length <= 1;

/** Normalises the loose date shapes Firestore accumulated to a real `date`. */
const toDate = (value: unknown): string | null => {
	if (typeof value !== "string" || !value) return null;
	if (isoDate.test(value)) return value;
	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) return null;
	return parsed.toISOString().slice(0, 10);
};

const toAmount = (value: unknown): string | null => {
	const parsed = typeof value === "number" ? value : Number(value);
	if (!Number.isFinite(parsed)) return null;
	return parsed.toFixed(2);
};

console.log(`importing from ${dir}\n`);

// --- categories -------------------------------------------------------------
const categoryDocs = read<Record<string, any>>("categories");
const categoryRows = categoryDocs
	.filter((doc) => doc.type === "expense" || doc.type === "earning")
	.map((doc) => ({
		id: doc.id,
		name: doc.name ?? "Unnamed",
		type: doc.type as "expense" | "earning",
		color: doc.color ?? null,
		description: doc.description ?? null,
		excludeFromBudget: Boolean(doc.excludeFromBudget),
	}));
for (const doc of categoryDocs) {
	if (doc.type !== "expense" && doc.type !== "earning")
		problems.push(`category ${doc.id}: unusable type ${JSON.stringify(doc.type)}`);
}

if (allowOrphans) {
	categoryRows.push({
		id: ORPHAN_CATEGORY_ID,
		name: "Unknown (migrated)",
		type: "expense",
		color: "#999999",
		description: "Placeholder for references whose category no longer exists",
		excludeFromBudget: false,
	});
}

if (categoryRows.length)
	await db
		.insert(categories)
		.values(categoryRows)
		.onConflictDoUpdate({
			target: categories.id,
			set: {
				name: sqlExcluded("name"),
				type: sqlExcluded("type"),
				color: sqlExcluded("color"),
				description: sqlExcluded("description"),
				excludeFromBudget: sqlExcluded("exclude_from_budget"),
			},
		});
const categoryIds = new Set(categoryRows.map((row) => row.id));
console.log(`categories: ${categoryRows.length}`);

// --- tags -------------------------------------------------------------------
const tagRows = read<Record<string, any>>("tags").map((doc) => ({
	id: doc.id,
	name: doc.name ?? "Unnamed",
	color: doc.color ?? null,
	description: doc.description ?? null,
}));
if (tagRows.length)
	await db
		.insert(tags)
		.values(tagRows)
		.onConflictDoUpdate({
			target: tags.id,
			set: {
				name: sqlExcluded("name"),
				color: sqlExcluded("color"),
				description: sqlExcluded("description"),
			},
		});
const tagIds = new Set(tagRows.map((row) => row.id));
console.log(`tags: ${tagRows.length}`);

/** Resolves a stored category reference, honouring --allow-orphans. */
const resolveCategory = (value: unknown, where: string): string | null => {
	const id = typeof value === "string" ? value : "";
	if (categoryIds.has(id)) return id;
	problems.push(`${where}: category ${JSON.stringify(value)} does not exist`);
	return allowOrphans ? ORPHAN_CATEGORY_ID : null;
};

const resolveTag = (value: unknown): string | null => {
	const id = typeof value === "string" ? value : "";
	return tagIds.has(id) ? id : null;
};

// --- recurring --------------------------------------------------------------
const recurringRows = [];
for (const doc of read<Record<string, any>>("recurring")) {
	const categoryId = resolveCategory(doc.category, `recurring ${doc.id}`);
	const amount = toAmount(doc.amount);
	if (!categoryId || !amount) continue;
	recurringRows.push({
		id: doc.id,
		description: doc.description ?? "",
		amount,
		categoryId,
		type: (doc.type === "earning" ? "earning" : "expense") as
			| "expense"
			| "earning",
		tagId: resolveTag(doc.tag),
		dayOfMonth: Number(doc.dayOfMonth) || 1,
		active: doc.active !== false,
		lastPeriod: doc.lastPeriod ?? "",
		createdAt: typeof doc.createdAt === "number" ? doc.createdAt : null,
	});
}
if (recurringRows.length)
	await db
		.insert(recurring)
		.values(recurringRows)
		.onConflictDoUpdate({
			target: recurring.id,
			set: {
				description: sqlExcluded("description"),
				amount: sqlExcluded("amount"),
				categoryId: sqlExcluded("category_id"),
				type: sqlExcluded("type"),
				tagId: sqlExcluded("tag_id"),
				dayOfMonth: sqlExcluded("day_of_month"),
				active: sqlExcluded("active"),
				lastPeriod: sqlExcluded("last_period"),
				createdAt: sqlExcluded("created_at"),
			},
		});
const recurringIds = new Set(recurringRows.map((row) => row.id));
console.log(`recurring: ${recurringRows.length}`);

// --- transactions -----------------------------------------------------------
const transactionRows = [];
for (const doc of read<Record<string, any>>("transactions")) {
	if (isEmpty(doc)) {
		emptyDocs++;
		continue;
	}
	const categoryId = resolveCategory(doc.category, `transaction ${doc.id}`);
	const date = toDate(doc.date);
	const amount = toAmount(doc.amount);
	if (!date) problems.push(`transaction ${doc.id}: unusable date ${JSON.stringify(doc.date)}`);
	if (!amount) problems.push(`transaction ${doc.id}: unusable amount ${JSON.stringify(doc.amount)}`);
	if (!categoryId || !date || !amount) continue;

	transactionRows.push({
		id: doc.id,
		date,
		month: doc.month ?? "",
		year: doc.year ?? date.slice(0, 4),
		amount,
		description: doc.description ?? "",
		categoryId,
		type: (doc.type === "earning" ? "earning" : "expense") as
			| "expense"
			| "earning",
		tagId: resolveTag(doc.tag),
		recurringId: recurringIds.has(doc.recurringId) ? doc.recurringId : null,
		createdAt: typeof doc.createdAt === "number" ? doc.createdAt : null,
	});
}
// Chunked: a single multi-thousand-row insert blows past the parameter limit.
for (let i = 0; i < transactionRows.length; i += 500) {
	await db
		.insert(transactions)
		.values(transactionRows.slice(i, i + 500))
		.onConflictDoUpdate({
			target: transactions.id,
			set: {
				date: sqlExcluded("date"),
				month: sqlExcluded("month"),
				year: sqlExcluded("year"),
				amount: sqlExcluded("amount"),
				description: sqlExcluded("description"),
				categoryId: sqlExcluded("category_id"),
				type: sqlExcluded("type"),
				tagId: sqlExcluded("tag_id"),
				recurringId: sqlExcluded("recurring_id"),
				createdAt: sqlExcluded("created_at"),
			},
		});
}
console.log(`transactions: ${transactionRows.length}`);

// --- stats ------------------------------------------------------------------
const statsDocs = read<Record<string, any>>("stats");
/** The unique (year, month, type) key did not exist in Firestore; keep the freshest. */
const byPeriod = new Map<string, Record<string, any>>();
for (const doc of statsDocs) {
	const key = `${doc.year}|${doc.month}|${doc.type}`;
	const current = byPeriod.get(key);
	if (!current) {
		byPeriod.set(key, doc);
		continue;
	}
	problems.push(`stats ${doc.id}: duplicate period ${key}`);
	const newer = `${doc.lastUpdate ?? ""}` > `${current.lastUpdate ?? ""}`;
	if (newer) byPeriod.set(key, doc);
}

const statsRows = [];
const summaryRows = [];
for (const doc of byPeriod.values()) {
	const total = toAmount(doc.total);
	if (!total) continue;
	statsRows.push({
		id: doc.id,
		month: doc.month ?? "",
		year: doc.year ?? "",
		total,
		type: (doc.type === "earning" ? "earning" : "expense") as
			| "expense"
			| "earning",
		lastUpdate: doc.lastUpdate ?? "",
	});
	for (const entry of doc.categorySummary ?? []) {
		const entryTotal = toAmount(entry.total);
		if (!entryTotal) continue;
		summaryRows.push({
			statsId: doc.id,
			categoryId: entry.categoryId,
			total: entryTotal,
		});
	}
}
if (statsRows.length)
	await db
		.insert(stats)
		.values(statsRows)
		.onConflictDoUpdate({
			target: stats.id,
			set: {
				month: sqlExcluded("month"),
				year: sqlExcluded("year"),
				total: sqlExcluded("total"),
				type: sqlExcluded("type"),
				lastUpdate: sqlExcluded("last_update"),
			},
		});
if (summaryRows.length)
	await db
		.insert(statsCategories)
		.values(summaryRows)
		.onConflictDoUpdate({
			target: [statsCategories.statsId, statsCategories.categoryId],
			set: { total: sqlExcluded("total") },
		});
console.log(`stats: ${statsRows.length} (${summaryRows.length} category rows)`);

// --- checklists -------------------------------------------------------------
const groceryRows = read<Record<string, any>>("groceries").map((doc) => ({
	id: doc.id,
	label: doc.label ?? "",
	checked: Boolean(doc.checked),
	category: doc.category ?? null,
}));
if (groceryRows.length)
	await db
		.insert(groceries)
		.values(groceryRows)
		.onConflictDoUpdate({
			target: groceries.id,
			set: {
				label: sqlExcluded("label"),
				checked: sqlExcluded("checked"),
				category: sqlExcluded("category"),
			},
		});
console.log(`groceries: ${groceryRows.length}`);

const todoRows = read<Record<string, any>>("todo").map((doc) => ({
	id: doc.id,
	label: doc.label ?? "",
	checked: Boolean(doc.checked),
}));
if (todoRows.length)
	await db
		.insert(todos)
		.values(todoRows)
		.onConflictDoUpdate({
			target: todos.id,
			set: { label: sqlExcluded("label"), checked: sqlExcluded("checked") },
		});
console.log(`todo: ${todoRows.length}`);

// --- settings ---------------------------------------------------------------
const settingRows = read<Record<string, any>>("settings").map((doc) => {
	const { id, ...value } = doc;
	return { key: id, value, updatedAt: new Date() };
});
if (settingRows.length)
	await db
		.insert(settings)
		.values(settingRows)
		.onConflictDoUpdate({
			target: settings.key,
			set: { value: sqlExcluded("value"), updatedAt: new Date() },
		});
console.log(`settings: ${settingRows.length}`);

// --- users ------------------------------------------------------------------
/**
 * Firebase accounts carry no password, so each imported user gets an unusable
 * hash. Give them a real one with `bun run user:create <email> <password>`.
 */
const FIREBASE_ADMIN_UIDS = [
	"70DafDh0t0VJ6kwfES1WPYd9s723",
	"RnGor26IYQM6vwRwq12vH1gKC1m1",
];
const userDocs = read<Record<string, any>>("users").filter((doc) => doc.email);
const userRows = [];
for (const doc of userDocs) {
	userRows.push({
		id: doc.uid ?? doc.id,
		email: `${doc.email}`.toLowerCase(),
		passwordHash: await Bun.password.hash(crypto.randomUUID(), {
			algorithm: "argon2id",
		}),
		displayName: doc.displayName ?? null,
		photoUrl: doc.photoURL ?? null,
		isAdmin: FIREBASE_ADMIN_UIDS.includes(doc.uid ?? doc.id),
	});
}
if (userRows.length)
	await db
		.insert(users)
		.values(userRows)
		.onConflictDoUpdate({
			target: users.email,
			set: {
				displayName: sqlExcluded("display_name"),
				photoUrl: sqlExcluded("photo_url"),
				isAdmin: sqlExcluded("is_admin"),
			},
		});
console.log(`users: ${userRows.length} (passwords must be set separately)`);

if (emptyDocs)
	console.log(`\n${emptyDocs} empty document(s) skipped (no fields to migrate)`);

if (problems.length) {
	console.log(`\n${problems.length} row(s) needed attention:`);
	for (const problem of problems.slice(0, 50)) console.log(`  - ${problem}`);
	if (problems.length > 50)
		console.log(`  ... and ${problems.length - 50} more`);
	if (!allowOrphans)
		console.log(
			"\nRe-run with --allow-orphans to park dangling references on a placeholder category.",
		);
}

await sql.end();
