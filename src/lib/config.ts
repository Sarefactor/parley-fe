/**
 * Application configuration.
 * Values can be overridden via Vite env vars (e.g. VITE_API_BASE_URL in a .env file).
 */
export const config = {
	apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'https://localhost:7005',

	endpoints: {
		parleySearch: '/api/parley/search',
		parleyGet: '/api/parley/get',
		parleyUpsert: '/api/parley/upsert',
		parleySetActiveSchema: '/api/parley/setActiveSchema'
	},

	search: {
		defaultPageSize: 8
	}
} as const;

/** Builds the parley search URL for a given page. */
export function parleySearchUrl(skip: number, take: number): string {
	return `${config.apiBaseUrl}${config.endpoints.parleySearch}?skip=${skip}&take=${take}`;
}

/** Builds the parley get URL for a single agent schema. */
export function parleyGetUrl(agentSchemaId: string): string {
	return `${config.apiBaseUrl}${config.endpoints.parleyGet}?agentSchemaId=${encodeURIComponent(agentSchemaId)}`;
}

/** Builds the parley upsert URL. */
export function parleyUpsertUrl(): string {
	return `${config.apiBaseUrl}${config.endpoints.parleyUpsert}`;
}

/** Builds the set-active-schema URL for the given agent schema id. */
export function parleySetActiveSchemaUrl(agentSchemaId: string): string {
	return `${config.apiBaseUrl}${config.endpoints.parleySetActiveSchema}?agentSchemaId=${encodeURIComponent(agentSchemaId)}`;
}
