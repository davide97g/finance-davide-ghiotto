/**
 * Applies every pending drizzle migration, then exits. Runs on container start.
 *
 * `depends_on: service_healthy` only orders the first `compose up`: after a
 * reboot or a power cut Docker starts every container at once, so Postgres is
 * usually still initialising when this runs. Retrying here turns that race
 * into a short wait, instead of a crash loop whose restart backoff would keep
 * the API down for minutes after the database is already up.
 */
import { migrate } from "drizzle-orm/postgres-js/migrator";
import { db, sql } from "./client";

const ATTEMPTS = 60;
const DELAY_MS = 2000;

for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
	try {
		await migrate(db, { migrationsFolder: `${import.meta.dir}/../../drizzle` });
		console.log("migrations applied");
		break;
	} catch (error) {
		if (attempt === ATTEMPTS) {
			console.error("database unreachable, giving up", error);
			await sql.end({ timeout: 5 });
			process.exit(1);
		}
		console.log(
			`database not ready (attempt ${attempt}/${ATTEMPTS}), retrying in ${DELAY_MS}ms`,
		);
		await Bun.sleep(DELAY_MS);
	}
}

await sql.end();
