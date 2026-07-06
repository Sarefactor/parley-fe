import type { AgentSchemaDto } from '$parleyts/agent-schema-dto';
import type { AgentSchemaSearchItemDto } from '$parleyts/agent-schema-search-item-dto';
import type { ParleyValidationContextDto } from '$parleyts/parley-validation-context-dto';
import type { SearchResultDto } from '$parleyts/search-result-dto';
import type { WorkflowSchemaDto } from '$parleyts/workflow-schema-dto';
import {
	agentSchemaGetUrl,
	agentSchemaSearchUrl,
	agentSchemaSetActiveUrl,
	agentSchemaUpsertUrl,
	workflowGetUrl,
	workflowSchemaSearchUrl,
	workflowUpsertUrl
} from '$lib/config';

/** Thrown when an upsert endpoint rejects the payload with validation errors (422). */
export class UpsertValidationError extends Error {
	readonly context: ParleyValidationContextDto;

	constructor(context: ParleyValidationContextDto) {
		super('Upsert Failed: Validation Errors');
		this.name = 'UpsertValidationError';
		this.context = context;
	}
}

async function getJson<T>(url: string, fetchFn: typeof fetch, what: string): Promise<T> {
	const response = await fetchFn(url, { headers: { Accept: 'application/json' } });

	if (!response.ok) {
		throw new Error(`${what} request failed: ${response.status} ${response.statusText}`);
	}

	return (await response.json()) as T;
}

async function postUpsert(url: string, body: unknown, fetchFn: typeof fetch): Promise<void> {
	const response = await fetchFn(url, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
		body: JSON.stringify(body)
	});

	if (response.status === 422) {
		throw new UpsertValidationError((await response.json()) as ParleyValidationContextDto);
	}

	if (!response.ok) {
		throw new Error(`Upsert failed: ${response.status} ${response.statusText}`);
	}
}

/** Fetches a page of agent schemas from the Parley API. */
export async function searchAgentSchemas(
	skip: number,
	take: number,
	fetchFn: typeof fetch = fetch
): Promise<SearchResultDto<AgentSchemaSearchItemDto>> {
	return getJson(agentSchemaSearchUrl(skip, take), fetchFn, 'Search');
}

/** Fetches a single agent schema by id. */
export async function getAgentSchema(
	agentSchemaId: string,
	fetchFn: typeof fetch = fetch
): Promise<AgentSchemaDto> {
	return getJson(agentSchemaGetUrl(agentSchemaId), fetchFn, 'Get');
}

/** Creates or updates an agent schema. */
export async function upsertAgentSchema(
	agentSchema: AgentSchemaDto,
	fetchFn: typeof fetch = fetch
): Promise<void> {
	return postUpsert(agentSchemaUpsertUrl(), agentSchema, fetchFn);
}

/** Marks the given agent schema as the active one. */
export async function setActiveSchema(
	agentSchemaId: string,
	fetchFn: typeof fetch = fetch
): Promise<void> {
	const response = await fetchFn(agentSchemaSetActiveUrl(agentSchemaId), {
		method: 'POST',
		headers: { Accept: 'application/json' }
	});

	if (!response.ok) {
		throw new Error(`Set active schema failed: ${response.status} ${response.statusText}`);
	}
}

/**
 * Fetches a page of workflow schemas. Same result shape as the agent-schema
 * search; item ids are workflow execution-node ids.
 */
export async function searchWorkflowSchemas(
	skip: number,
	take: number,
	fetchFn: typeof fetch = fetch
): Promise<SearchResultDto<AgentSchemaSearchItemDto>> {
	return getJson(workflowSchemaSearchUrl(skip, take), fetchFn, 'Search');
}

/** Fetches a single workflow schema by id (its execution-node id). */
export async function getWorkflowSchema(
	workflowSchemaId: string,
	fetchFn: typeof fetch = fetch
): Promise<WorkflowSchemaDto> {
	return getJson(workflowGetUrl(workflowSchemaId), fetchFn, 'Get');
}

/** Creates or updates a single workflow schema. */
export async function upsertWorkflowSchema(
	workflow: WorkflowSchemaDto,
	fetchFn: typeof fetch = fetch
): Promise<void> {
	return postUpsert(workflowUpsertUrl(), workflow, fetchFn);
}
