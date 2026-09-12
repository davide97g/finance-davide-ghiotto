/**
 * Postgres schema mirroring the Firestore collections the app used to read
 * directly. Ids stay `text` and keep their original Firestore values so the
 * references already stored in prod data (transaction.category, .tag,
 * .recurringId) survive the import untouched.
 */
import { relations } from "drizzle-orm";
import {
	bigint,
	boolean,
	date,
	index,
	integer,
	jsonb,
	numeric,
	pgEnum,
	pgTable,
	primaryKey,
	text,
	timestamp,
	unique,
} from "drizzle-orm/pg-core";

/** Matches the `"expense" | "earning"` union used across the frontend models. */
export const entryType = pgEnum("entry_type", ["expense", "earning"]);

export const users = pgTable("users", {
	id: text("id").primaryKey(),
	email: text("email").notNull().unique(),
	/** Argon2id hash produced by Bun.password. */
	passwordHash: text("password_hash").notNull(),
	displayName: text("display_name"),
	photoUrl: text("photo_url"),
	isAdmin: boolean("is_admin").notNull().default(false),
	createdAt: timestamp("created_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
});

export const categories = pgTable("categories", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	type: entryType("type").notNull(),
	color: text("color"),
	description: text("description"),
	excludeFromBudget: boolean("exclude_from_budget").notNull().default(false),
});

export const tags = pgTable("tags", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	color: text("color"),
	description: text("description"),
});

export const recurring = pgTable("recurring", {
	id: text("id").primaryKey(),
	description: text("description").notNull(),
	amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
	categoryId: text("category_id")
		.notNull()
		.references(() => categories.id, { onDelete: "restrict" }),
	type: entryType("type").notNull(),
	tagId: text("tag_id").references(() => tags.id, { onDelete: "set null" }),
	/** Clamped to the month length when the transaction is generated. */
	dayOfMonth: integer("day_of_month").notNull(),
	active: boolean("active").notNull().default(true),
	/** Last generated period as `YYYY-MM`. */
	lastPeriod: text("last_period").notNull(),
	/** Unix milliseconds, as the frontend model stores it. */
	createdAt: bigint("created_at", { mode: "number" }),
});

export const transactions = pgTable(
	"transactions",
	{
		id: text("id").primaryKey(),
		date: date("date").notNull(),
		/** English month name, kept denormalised because the UI filters on it. */
		month: text("month").notNull(),
		year: text("year").notNull(),
		amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
		description: text("description").notNull().default(""),
		categoryId: text("category_id")
			.notNull()
			.references(() => categories.id, { onDelete: "restrict" }),
		type: entryType("type").notNull(),
		tagId: text("tag_id").references(() => tags.id, { onDelete: "set null" }),
		recurringId: text("recurring_id").references(() => recurring.id, {
			onDelete: "set null",
		}),
		createdAt: bigint("created_at", { mode: "number" }),
	},
	(table) => [
		index("transactions_period_idx").on(table.year, table.month),
		index("transactions_date_idx").on(table.date),
		index("transactions_category_idx").on(table.categoryId),
		index("transactions_type_idx").on(table.type),
	],
);

export const stats = pgTable(
	"stats",
	{
		id: text("id").primaryKey(),
		month: text("month").notNull(),
		year: text("year").notNull(),
		total: numeric("total", { precision: 14, scale: 2 }).notNull(),
		type: entryType("type").notNull(),
		/** ISO string written by the frontend when the month was frozen. */
		lastUpdate: text("last_update").notNull(),
	},
	(table) => [
		unique("stats_period_type_key").on(table.year, table.month, table.type),
		index("stats_year_idx").on(table.year),
	],
);

/** One row per category inside a frozen month, replacing the nested array. */
export const statsCategories = pgTable(
	"stats_categories",
	{
		statsId: text("stats_id")
			.notNull()
			.references(() => stats.id, { onDelete: "cascade" }),
		categoryId: text("category_id").notNull(),
		total: numeric("total", { precision: 14, scale: 2 }).notNull(),
	},
	(table) => [primaryKey({ columns: [table.statsId, table.categoryId] })],
);

export const groceries = pgTable("groceries", {
	id: text("id").primaryKey(),
	label: text("label").notNull(),
	checked: boolean("checked").notNull().default(false),
	category: text("category"),
});

export const todos = pgTable("todos", {
	id: text("id").primaryKey(),
	label: text("label").notNull(),
	checked: boolean("checked").notNull().default(false),
});

/** Singleton documents the app kept under Firestore's `settings` collection. */
export const settings = pgTable("settings", {
	key: text("key").primaryKey(),
	value: jsonb("value").notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true })
		.notNull()
		.defaultNow(),
});

export const statsRelations = relations(stats, ({ many }) => ({
	categorySummary: many(statsCategories),
}));

export const statsCategoriesRelations = relations(
	statsCategories,
	({ one }) => ({
		stats: one(stats, {
			fields: [statsCategories.statsId],
			references: [stats.id],
		}),
	}),
);
