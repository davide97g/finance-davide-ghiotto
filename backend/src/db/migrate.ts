/** Applies every pending drizzle migration, then exits. Runs on container start. */
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db, sql } from "./client";

await migrate(db, { migrationsFolder: `${import.meta.dir}/../../drizzle` });
console.log("migrations applied");
await sql.end();
