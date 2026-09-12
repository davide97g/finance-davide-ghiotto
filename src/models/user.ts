/**
 * Shape of the signed-in user.
 *
 * Field names deliberately mirror Firebase's `User` (`uid`, `displayName`,
 * `photoURL`) so every component that already reads them keeps working after
 * the move to the self-hosted API.
 */
export interface AppUser {
	uid: string;
	email: string | null;
	displayName: string | null;
	photoURL: string | null;
	isAdmin?: boolean;
}
