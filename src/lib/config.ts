/**
 * Application configuration.
 * Values can be overridden via Vite env vars (e.g. VITE_API_BASE_URL in a .env file).
 */
export const config = {
	apiBaseUrl: import.meta.env.VITE_API_BASE_URL ?? 'https://localhost:7005',

	endpoints: {
		agentSchemaSearch: '/api/parley/agentschemas/search',
		agentSchemaGet: '/api/parley/agentschemas/get',
		agentSchemaUpsert: '/api/parley/agentschemas/upsert',
		agentSchemaSetActive: '/api/parley/agentschemas/setActiveSchema',
		workflowSchemaSearch: '/api/parley/workflowschemas/search',
		workflowGet: '/api/parley/workflowschemas/get',
		workflowUpsert: '/api/parley/workflowschemas/upsert'
	},

	search: {
		defaultPageSize: 8
	}
} as const;

/** Builds the agent-schema search URL for a given page. */
export function agentSchemaSearchUrl(skip: number, take: number): string {
	return `${config.apiBaseUrl}${config.endpoints.agentSchemaSearch}?skip=${skip}&take=${take}`;
}

/** Builds the get URL for a single agent schema. */
export function agentSchemaGetUrl(agentSchemaId: string): string {
	return `${config.apiBaseUrl}${config.endpoints.agentSchemaGet}?agentSchemaId=${encodeURIComponent(agentSchemaId)}`;
}

/** Builds the agent-schema upsert URL. */
export function agentSchemaUpsertUrl(): string {
	return `${config.apiBaseUrl}${config.endpoints.agentSchemaUpsert}`;
}

/** Builds the set-active-schema URL for the given agent schema id. */
export function agentSchemaSetActiveUrl(agentSchemaId: string): string {
	return `${config.apiBaseUrl}${config.endpoints.agentSchemaSetActive}?agentSchemaId=${encodeURIComponent(agentSchemaId)}`;
}

/** Builds the workflow-schema search URL for a given page. */
export function workflowSchemaSearchUrl(skip: number, take: number): string {
	return `${config.apiBaseUrl}${config.endpoints.workflowSchemaSearch}?skip=${skip}&take=${take}`;
}

/** Builds the get URL for a single workflow schema. */
export function workflowGetUrl(workflowSchemaId: string): string {
	return `${config.apiBaseUrl}${config.endpoints.workflowGet}?workflowSchemaId=${encodeURIComponent(workflowSchemaId)}`;
}

/** Builds the workflow upsert URL. */
export function workflowUpsertUrl(): string {
	return `${config.apiBaseUrl}${config.endpoints.workflowUpsert}`;
}
