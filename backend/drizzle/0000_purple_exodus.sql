CREATE TYPE "public"."entry_type" AS ENUM('expense', 'earning');--> statement-breakpoint
CREATE TABLE "categories" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"type" "entry_type" NOT NULL,
	"color" text,
	"description" text,
	"exclude_from_budget" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "groceries" (
	"id" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"checked" boolean DEFAULT false NOT NULL,
	"category" text
);
--> statement-breakpoint
CREATE TABLE "recurring" (
	"id" text PRIMARY KEY NOT NULL,
	"description" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"category_id" text NOT NULL,
	"type" "entry_type" NOT NULL,
	"tag_id" text,
	"day_of_month" integer NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"last_period" text NOT NULL,
	"created_at" bigint
);
--> statement-breakpoint
CREATE TABLE "settings" (
	"key" text PRIMARY KEY NOT NULL,
	"value" jsonb NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stats" (
	"id" text PRIMARY KEY NOT NULL,
	"month" text NOT NULL,
	"year" text NOT NULL,
	"total" numeric(14, 2) NOT NULL,
	"type" "entry_type" NOT NULL,
	"last_update" text NOT NULL,
	CONSTRAINT "stats_period_type_key" UNIQUE("year","month","type")
);
--> statement-breakpoint
CREATE TABLE "stats_categories" (
	"stats_id" text NOT NULL,
	"category_id" text NOT NULL,
	"total" numeric(14, 2) NOT NULL,
	CONSTRAINT "stats_categories_stats_id_category_id_pk" PRIMARY KEY("stats_id","category_id")
);
--> statement-breakpoint
CREATE TABLE "tags" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"color" text,
	"description" text
);
--> statement-breakpoint
CREATE TABLE "todos" (
	"id" text PRIMARY KEY NOT NULL,
	"label" text NOT NULL,
	"checked" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"date" date NOT NULL,
	"month" text NOT NULL,
	"year" text NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"category_id" text NOT NULL,
	"type" "entry_type" NOT NULL,
	"tag_id" text,
	"recurring_id" text,
	"created_at" bigint
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" text PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"display_name" text,
	"photo_url" text,
	"is_admin" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "recurring" ADD CONSTRAINT "recurring_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring" ADD CONSTRAINT "recurring_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stats_categories" ADD CONSTRAINT "stats_categories_stats_id_stats_id_fk" FOREIGN KEY ("stats_id") REFERENCES "public"."stats"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_recurring_id_recurring_id_fk" FOREIGN KEY ("recurring_id") REFERENCES "public"."recurring"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "stats_year_idx" ON "stats" USING btree ("year");--> statement-breakpoint
CREATE INDEX "transactions_period_idx" ON "transactions" USING btree ("year","month");--> statement-breakpoint
CREATE INDEX "transactions_date_idx" ON "transactions" USING btree ("date");--> statement-breakpoint
CREATE INDEX "transactions_category_idx" ON "transactions" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "transactions_type_idx" ON "transactions" USING btree ("type");