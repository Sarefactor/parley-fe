/** Generates a new uuid (v4). */
export function newUuid(): string {
	return crypto.randomUUID();
}
