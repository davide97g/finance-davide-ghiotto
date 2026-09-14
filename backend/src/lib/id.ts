/**
 * Firestore generated 20-character alphanumeric ids. New rows keep that shape
 * so ids stay visually and structurally uniform with the migrated data.
 */
const ALPHABET =
	"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export const newId = (length = 20) => {
	const bytes = crypto.getRandomValues(new Uint8Array(length));
	let id = "";
	for (const byte of bytes) id += ALPHABET[byte % ALPHABET.length];
	return id;
};
