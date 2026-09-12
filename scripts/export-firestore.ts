/**
 * Dumps every Firestore collection of the finance app to JSON files.
 *
 * The dump is the source of truth for the Postgres import and doubles as a
 * cold backup: one file per collection, one JSON object per document, with the
 * document id kept as `id` so references between collections survive.
 *
 * Usage:
 *   GOOGLE_APPLICATION_CREDENTIALS=/abs/path/service-account.json bun run export
 *
 * The service account key comes from the Firebase console:
 *   Project settings > Service accounts > Generate new private key.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

/** Collections read wholesale. `settings` holds singleton docs, not a list. */
const COLLECTIONS = [
	"users",
	"transactions",
	"categories",
	"tags",
	"recurring",
	"stats",
	"groceries",
	"todo",
	"settings",
];

const keyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
if (!keyPath) {
	console.error(
		"GOOGLE_APPLICATION_CREDENTIALS must point at a Firebase service account JSON key",
	);
	process.exit(1);
}

const serviceAccount = JSON.parse(await Bun.file(keyPath).text());
initializeApp({ cert: cert(serviceAccount) });
const db = getFirestore();

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const outDir = join(import.meta.dir, "..", "backup", stamp);
mkdirSync(outDir, { recursive: true });

/** Firestore Timestamps/GeoPoints are not JSON; flatten them to plain values. */
const plain = (value: unknown): unknown => {
	if (value === null || value === undefined) return value;
	if (typeof value === "object") {
		const obj = value as Record<string, unknown>;
		if (typeof obj.toDate === "function") {
			return (obj.toDate as () => Date)().toISOString();
		}
		if (Array.isArray(value)) return value.map(plain);
		return Object.fromEntries(
			Object.entries(obj).map(([k, v]) => [k, plain(v)]),
		);
	}
	return value;
};

const summary: Record<string, number> = {};

for (const name of COLLECTIONS) {
	const snapshot = await db.collection(name).get();
	const docs = snapshot.docs.map((doc) => ({
		id: doc.id,
		...(plain(doc.data()) as Record<string, unknown>),
	}));
	writeFileSync(join(outDir, `${name}.json`), JSON.stringify(docs, null, 2));
	summary[name] = docs.length;
	console.log(`${name}: ${docs.length} documents`);
}

writeFileSync(
	join(outDir, "manifest.json"),
	JSON.stringify(
		{ exportedAt: new Date().toISOString(), counts: summary },
		null,
		2,
	),
);

/** A stable `latest` pointer so the import script needs no argument. */
writeFileSync(
	join(import.meta.dir, "..", "backup", "latest.json"),
	JSON.stringify({ dir: stamp }, null, 2),
);

console.log(`\nBackup written to backup/${stamp}`);
