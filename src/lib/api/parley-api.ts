import type { AgentSchemaDto } from '$parleyts/agent-schema-dto';
import type { AgentSchemaSearchItemDto } from '$parleyts/agent-schema-search-item-dto';
import type { ParleyValidationContextDto } from '$parleyts/parley-validation-context-dto';
import type { SearchResultDto } from '$parleyts/search-result-dto';
import { parleyGetUrl, parleySearchUrl, parleySetActiveSchemaUrl, parleyUpsertUrl } from '$lib/config';

/** Thrown when the upsert endpoint rejects the schema with validation errors (422). */
export class UpsertValidationError extends Error {
	readonly context: ParleyValidationContextDto;

	constructor(context: ParleyValidationContextDto) {
		super('Upsert Failed: Validation Errors');
		this.name = 'UpsertValidationError';
		this.context = context;
	}
}

/** Fetches a page of agent schemas from the Parley API. */
export async function searchAgentSchemas(
	skip: number,
	take: number,
	fetchFn: typeof fetch = fetch
): Promise<SearchResultDto<AgentSchemaSearchItemDto>> {
	const response = await fetchFn(parleySearchUrl(skip, take), {
		headers: { Accept: 'application/json' }
	});

	if (!response.ok) {
		throw new Error(`Search request failed: ${response.status} ${response.statusText}`);
	}

	return (await response.json()) as SearchResultDto<AgentSchemaSearchItemDto>;
}

/** Fetches a single agent schema by id. */
export async function getAgentSchema(
	agentSchemaId: string,
	fetchFn: typeof fetch = fetch
): Promise<AgentSchemaDto> {
	const response = await fetchFn(parleyGetUrl(agentSchemaId), {
		headers: { Accept: 'application/json' }
	});

	if (!response.ok) {
		throw new Error(`Get request failed: ${response.status} ${response.statusText}`);
	}

	return (await response.json()) as AgentSchemaDto;
}

/** Creates or updates an agent schema. */
export async function upsertAgentSchema(
	agentSchema: AgentSchemaDto,
	fetchFn: typeof fetch = fetch
): Promise<void> {
	const response = await fetchFn(parleyUpsertUrl(), {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
		body: JSON.stringify(agentSchema)
	});

	if (response.status === 422) {
		throw new UpsertValidationError((await response.json()) as ParleyValidationContextDto);
	}

	if (!response.ok) {
		throw new Error(`Upsert failed: ${response.status} ${response.statusText}`);
	}
}

/** Marks the given agent schema as the active one. */
export async function setActiveSchema(
	agentSchemaId: string,
	fetchFn: typeof fetch = fetch
): Promise<void> {
	const response = await fetchFn(parleySetActiveSchemaUrl(agentSchemaId), {
		method: 'POST',
		headers: { Accept: 'application/json' }
	});

	if (!response.ok) {
		throw new Error(`Set active schema failed: ${response.status} ${response.statusText}`);
	}
}
