import { newUuid } from '$lib/config-builder/ids';
import { NodeType, type NodeTypeId } from '$lib/config-builder/node-types';
import type { AgentSchemaDto } from '$parleyts/agent-schema-dto';
import type { ChoiceNodeOptions } from '$parleyts/choice-node-options';
import type { ClassificationNodeOptions } from '$parleyts/classification-node-options';
import { ChoiceValidationType } from '$parleyts/choice-validation-type';
import type { ConfirmationNodeOptions } from '$parleyts/confirmation-node-options';
import type { GenerationNodeOptions } from '$parleyts/generation-node-options';
import { HttpMethodType } from '$parleyts/http-method-type';
import type { HttpRequestNodeOptions } from '$parleyts/http-request-node-options';
import type { InputNodeOptions } from '$parleyts/input-node-options';
import type { MessageNodeOptions } from '$parleyts/message-node-options';
import type { NodeConfigDto } from '$parleyts/node-config-dto';
import type { ParleyNodeValidationErrorDetailDto } from '$parleyts/parley-node-validation-error-detail-dto';
import type { ParleyValidationContextDto } from '$parleyts/parley-validation-context-dto';
import type { ParleyWorkflowValidationErrorDto } from '$parleyts/parley-workflow-validation-error-dto';
import type { TransitionDto } from '$parleyts/transition-dto';
import type { ValidationRuleDto } from '$parleyts/validation-rule-dto';
import { VariableDataType } from '$parleyts/variable-data-type';
import type { WorkflowErrorType } from '$parleyts/workflow-error-type';
import type { WorkflowVariableDto } from '$parleyts/workflow-variable-dto';

// Re-export the generated node option types for components.
export type { ChoiceNodeOptions } from '$parleyts/choice-node-options';
export type { ClassificationNodeOptions } from '$parleyts/classification-node-options';
export type { ConfirmationNodeOptions } from '$parleyts/confirmation-node-options';
export type { GenerationNodeOptions } from '$parleyts/generation-node-options';
export type { HttpRequestNodeOptions } from '$parleyts/http-request-node-options';
export type { InputNodeOptions } from '$parleyts/input-node-options';
export type { MessageNodeOptions } from '$parleyts/message-node-options';

/**
 * A workflow being built. Mirrors WorkflowSchemaDto, except nodes are keyed by
 * id for fast lookup.
 */
export interface WorkflowDraft {
	name: string;
	intent: string;
	description: string;
	executionNodeId: string;
	workflowVariables: WorkflowVariableDto[];
	nodes: Record<string, NodeConfigDto>;
}

export type ModalState =
	| { kind: 'agent' }
	| { kind: 'workflow' }
	| { kind: 'node'; nodeId: string }
	| { kind: 'transition'; sourceId: string; targetId: string }
	| null;

export function emptyValidationRule(): ValidationRuleDto {
	return {
		stringComparisonType: 0,
		matchString: '',
		regexString: '',
		numberComparisonType: 0,
		matchInt: 0,
		boolComparisonType: 0,
		matchBool: false,
		matchDateTime: null as unknown as Date
	};
}

export function emptyVariable(
	type: VariableDataType = VariableDataType.String
): WorkflowVariableDto {
	return {
		name: '',
		description: '',
		type,
		isList: false,
		isNullable: false,
		objectVariables: []
	};
}

function newNodeConfig(nodeType: NodeTypeId, position: { x: number; y: number }): NodeConfigDto {
	const id = newUuid();
	const config: NodeConfigDto = {
		nodeId: id,
		nodeType,
		// Nullable Guids server-side: must be null (not '') until set.
		primaryTransitionNode: null as unknown as string,
		secondaryTransitionNode: null as unknown as string,
		nodeOptions: {},
		nodeVariables: [],
		transitions: [],
		validationRules: [],
		position: { x: position.x, y: position.y }
	};

	switch (nodeType) {
		case NodeType.Completion:
			// A CompletionNode sets its primary/default transition to its own id.
			config.primaryTransitionNode = id;
			break;
		case NodeType.Message:
			config.nodeOptions = { message: '' } satisfies MessageNodeOptions;
			break;
		case NodeType.Input:
			config.nodeOptions = { message: '', errorMessage: '', targetKey: '' } satisfies InputNodeOptions;
			config.nodeVariables = [emptyVariable()];
			break;
		case NodeType.Confirmation:
			// Confirmation nodes always set a single bool variable.
			config.nodeOptions = { message: '', targetKey: '' } satisfies ConfirmationNodeOptions;
			config.nodeVariables = [emptyVariable(VariableDataType.Bool)];
			break;
		case NodeType.Generation:
			// Generation nodes always set a single string variable.
			config.nodeOptions = { message: '', targetKey: '' } satisfies GenerationNodeOptions;
			config.nodeVariables = [emptyVariable()];
			break;
		case NodeType.Classification:
			config.nodeOptions = { targetKey: '' } satisfies ClassificationNodeOptions;
			break;
		case NodeType.HttpRequest:
			config.nodeOptions = {
				url: '',
				methodType: HttpMethodType.Get,
				headers: {},
				contentType: 'application/json',
				timeoutSeconds: 10,
				requestParameters: [],
				responseMappings: []
			} satisfies HttpRequestNodeOptions;
			break;
		case NodeType.Choice:
			// Choice nodes always set a single string variable.
			config.nodeOptions = {
				message: '',
				targetKey: '',
				errorMessage: '',
				choices: [],
				validationType: ChoiceValidationType.Default
			} satisfies ChoiceNodeOptions;
			config.nodeVariables = [emptyVariable()];
			break;
	}

	return config;
}

/** Fills in anything the server may have omitted so the editor can bind safely. */
function normalizeNode(node: NodeConfigDto): NodeConfigDto {
	node.nodeOptions = node.nodeOptions ?? {};
	node.nodeVariables = node.nodeVariables ?? [];
	node.transitions = node.transitions ?? [];
	node.validationRules = node.validationRules ?? [];
	node.position = node.position ?? { x: 0, y: 0 };
	if (node.nodeType === NodeType.Message) {
		node.nodeOptions = { message: '', ...node.nodeOptions };
	} else if (node.nodeType === NodeType.Input) {
		node.nodeOptions = { message: '', errorMessage: '', targetKey: '', ...node.nodeOptions };
		if (node.nodeVariables.length === 0) node.nodeVariables.push(emptyVariable());
	} else if (node.nodeType === NodeType.Confirmation) {
		node.nodeOptions = { message: '', targetKey: '', ...node.nodeOptions };
		if (node.nodeVariables.length === 0) {
			node.nodeVariables.push(emptyVariable(VariableDataType.Bool));
		}
	} else if (node.nodeType === NodeType.Generation) {
		node.nodeOptions = { message: '', targetKey: '', ...node.nodeOptions };
		if (node.nodeVariables.length === 0) node.nodeVariables.push(emptyVariable());
	} else if (node.nodeType === NodeType.Classification) {
		node.nodeOptions = { targetKey: '', ...node.nodeOptions };
	} else if (node.nodeType === NodeType.HttpRequest) {
		node.nodeOptions = {
			url: '',
			methodType: HttpMethodType.Get,
			contentType: 'application/json',
			timeoutSeconds: 10,
			...node.nodeOptions
		};
		const options = node.nodeOptions as HttpRequestNodeOptions;
		options.headers = options.headers ?? {};
		options.requestParameters = options.requestParameters ?? [];
		options.responseMappings = options.responseMappings ?? [];
	} else if (node.nodeType === NodeType.Choice) {
		node.nodeOptions = {
			message: '',
			targetKey: '',
			errorMessage: '',
			choices: [],
			validationType: ChoiceValidationType.Default,
			...node.nodeOptions
		};
		const options = node.nodeOptions as ChoiceNodeOptions;
		options.choices = options.choices ?? [];
		if (node.nodeVariables.length === 0) node.nodeVariables.push(emptyVariable());
	}
	return node;
}

class AgentSchemaStore {
	agentId = $state(newUuid());
	agentName = $state('');
	agentInstructions = $state('');
	workflows = $state<WorkflowDraft[]>([]);
	currentIndex = $state(0);
	modal = $state<ModalState>(null);

	/** Serialized snapshot of the last clean (loaded/saved/reset) state. */
	private cleanSnapshot = '';

	/** Validation errors from the last failed upsert (422 response), if any. */
	validation = $state<ParleyValidationContextDto | null>(null);

	/** The workflow currently shown on the canvas. */
	get workflow(): WorkflowDraft | null {
		return this.workflows[this.currentIndex] ?? null;
	}

	/** Creates a workflow with its (only) execution node already placed, and selects it. */
	createWorkflow(): NodeConfigDto {
		const execution = newNodeConfig(NodeType.Execution, { x: 120, y: 260 });
		this.workflows.push({
			name: '',
			intent: '',
			description: '',
			executionNodeId: execution.nodeId,
			workflowVariables: [],
			nodes: { [execution.nodeId]: execution }
		});
		this.currentIndex = this.workflows.length - 1;
		return execution;
	}

	/** Adds a node of the given type. Execution nodes are rejected — there can only be one. */
	addNode(nodeType: NodeTypeId, position: { x: number; y: number }): NodeConfigDto | null {
		if (!this.workflow || nodeType === NodeType.Execution) return null;
		const config = newNodeConfig(nodeType, position);
		this.workflow.nodes[config.nodeId] = config;
		return config;
	}

	getNode(nodeId: string): NodeConfigDto | undefined {
		return this.workflow?.nodes[nodeId];
	}

	/** Removes a node (except the execution node) and cleans up references to it. */
	removeNode(nodeId: string): void {
		const workflow = this.workflow;
		if (!workflow || nodeId === workflow.executionNodeId) return;
		delete workflow.nodes[nodeId];
		for (const node of Object.values(workflow.nodes)) {
			if (node.primaryTransitionNode === nodeId) {
				node.primaryTransitionNode = null as unknown as string;
			}
			if (node.secondaryTransitionNode === nodeId) {
				node.secondaryTransitionNode = null as unknown as string;
			}
			node.transitions = node.transitions.filter((t) => t.targetNodeId !== nodeId);
		}
	}

	setPrimaryTransition(sourceId: string, targetId: string | null): void {
		const node = this.getNode(sourceId);
		if (node) node.primaryTransitionNode = targetId as unknown as string;
	}

	setSecondaryTransition(sourceId: string, targetId: string | null): void {
		const node = this.getNode(sourceId);
		if (node) node.secondaryTransitionNode = targetId as unknown as string;
	}

	addTransition(sourceId: string, targetId: string): TransitionDto | undefined {
		const node = this.getNode(sourceId);
		if (!node) return undefined;
		const existing = node.transitions.find((t) => t.targetNodeId === targetId);
		if (existing) return existing;
		const transition: TransitionDto = {
			priority: node.transitions.length + 1,
			targetNodeId: targetId,
			transitionRules: []
		};
		node.transitions.push(transition);
		return transition;
	}

	removeTransition(sourceId: string, targetId: string): void {
		const node = this.getNode(sourceId);
		if (node) node.transitions = node.transitions.filter((t) => t.targetNodeId !== targetId);
	}

	getTransition(sourceId: string, targetId: string): TransitionDto | undefined {
		return this.getNode(sourceId)?.transitions.find((t) => t.targetNodeId === targetId);
	}

	/**
	 * All variables visible to node configuration: the current workflow's
	 * variables plus every node's variables, in one list.
	 */
	getAllVariables(): WorkflowVariableDto[] {
		const workflow = this.workflow;
		if (!workflow) return [];
		return [
			...workflow.workflowVariables,
			...Object.values(workflow.nodes).flatMap((n) => n.nodeVariables)
		];
	}

	openAgentOptions(): void {
		this.modal = { kind: 'agent' };
	}

	openWorkflowOptions(): void {
		this.modal = { kind: 'workflow' };
	}

	openNodeOptions(nodeId: string): void {
		this.modal = { kind: 'node', nodeId };
	}

	openTransitionOptions(sourceId: string, targetId: string): void {
		this.modal = { kind: 'transition', sourceId, targetId };
	}

	closeModal(): void {
		this.modal = null;
	}

	setValidation(context: ParleyValidationContextDto | null): void {
		this.validation = context;
	}

	/** Agent-level validation error messages from the last failed upsert. */
	get agentErrors(): string[] {
		return this.validation?.agentErrorMessages ?? [];
	}

	/** True when any workflow has validation errors. */
	get hasWorkflowErrors(): boolean {
		return (this.validation?.workflowErrors.length ?? 0) > 0;
	}

	/** Errors for a workflow. Workflows are identified by their execution node id. */
	workflowErrorsFor(executionNodeId: string): ParleyWorkflowValidationErrorDto | undefined {
		return this.validation?.workflowErrors.find((w) => w.workflowId === executionNodeId);
	}

	/** Workflow-level error messages of the given type for the current workflow. */
	currentWorkflowErrorMessages(type: WorkflowErrorType): string[] {
		const workflow = this.workflow;
		if (!workflow) return [];
		return (
			this.workflowErrorsFor(workflow.executionNodeId)
				?.errorDetails.filter((d) => d.type === type)
				.map((d) => d.errorMessage) ?? []
		);
	}

	/** All error details for a node, searched across every workflow's node errors. */
	nodeErrorDetails(nodeId: string): ParleyNodeValidationErrorDetailDto[] {
		if (!this.validation) return [];
		for (const workflowError of this.validation.workflowErrors) {
			const nodeError = workflowError.nodeErrors.find((n) => n.nodeId === nodeId);
			if (nodeError) return nodeError.errorDetails;
		}
		return [];
	}

	/** Error messages of the given type for a node. */
	nodeErrorMessages(nodeId: string, type: WorkflowErrorType): string[] {
		return this.nodeErrorDetails(nodeId)
			.filter((d) => d.type === type)
			.map((d) => d.errorMessage);
	}

	/** Marks the current state as clean (call after load/save). */
	markClean(): void {
		this.cleanSnapshot = JSON.stringify(this.toAgentSchemaDto());
	}

	/** True when the schema differs from the last loaded/saved/reset state. */
	get isDirty(): boolean {
		return JSON.stringify(this.toAgentSchemaDto()) !== this.cleanSnapshot;
	}

	/** Clears the store ready for building a brand-new agent schema. */
	reset(): void {
		this.agentId = newUuid();
		this.agentName = '';
		this.agentInstructions = '';
		this.workflows = [];
		this.currentIndex = 0;
		this.modal = null;
		this.validation = null;
		this.markClean();
	}

	/** Hydrates the store from an existing AgentSchemaDto (e.g. fetched from the API). */
	loadFromDto(dto: AgentSchemaDto): void {
		this.agentId = dto.id;
		this.agentName = dto.name ?? '';
		this.agentInstructions = dto.instructions ?? '';
		this.workflows = (dto.workflowSchemas ?? []).map((workflow) => ({
			name: workflow.name ?? '',
			intent: workflow.intent ?? '',
			description: workflow.description ?? '',
			executionNodeId: workflow.executionNodeId,
			workflowVariables: workflow.workflowVariables ?? [],
			nodes: Object.fromEntries(
				(workflow.nodes ?? []).map((node) => [node.nodeId, normalizeNode(node)])
			)
		}));
		this.currentIndex = 0;
		this.modal = null;
		this.validation = null;
		this.markClean();
	}

	/** Builds the AgentSchemaDto to send to the server. */
	toAgentSchemaDto(): AgentSchemaDto {
		return {
			id: this.agentId,
			name: this.agentName,
			instructions: this.agentInstructions,
			workflowSchemas: this.workflows.map((workflow) => ({
				name: workflow.name,
				intent: workflow.intent,
				description: workflow.description,
				executionNodeId: workflow.executionNodeId,
				workflowVariables: workflow.workflowVariables,
				nodes: Object.values(workflow.nodes)
			}))
		};
	}
}

/** Singleton store for the agent schema being built. */
export const schema = new AgentSchemaStore();
