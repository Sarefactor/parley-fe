/** Node type discriminators, matching NodeConfigDto.nodeType on the server. */
export const NodeType = {
	Execution: 'ExecutionNode',
	Completion: 'CompletionNode',
	Message: 'MessageNode',
	Input: 'InputNode',
	Confirmation: 'ConfirmationNode',
	Choice: 'ChoiceNode',
	Classification: 'ClassificationNode',
	HttpRequest: 'HttpRequestNode',
	Generation: 'GenerationNode',
	Iterator: 'IteratorNode',
	Transition: 'TransitionNode',
	CatFacts: 'CatFactsNode'
} as const;

export type NodeTypeId = (typeof NodeType)[keyof typeof NodeType];

export interface PaletteItem {
	nodeType: NodeTypeId;
	label: string;
}

/**
 * Nodes available in the sidebar palette.
 * The execution node is deliberately absent: one is auto-placed per workflow
 * and no more can be added.
 */
export const defaultPaletteNodes: PaletteItem[] = [
	{ nodeType: NodeType.Input, label: 'Input Node' },
	{ nodeType: NodeType.Message, label: 'Message Node' },
	{ nodeType: NodeType.Confirmation, label: 'Confirmation Node' },
	{ nodeType: NodeType.Choice, label: 'Choice Node' },
	{ nodeType: NodeType.Classification, label: 'Classification Node' },
	{ nodeType: NodeType.HttpRequest, label: 'Http Request Node' },
	{ nodeType: NodeType.Generation, label: 'Generation Node' },
	{ nodeType: NodeType.Iterator, label: 'Iterator Node' },
	{ nodeType: NodeType.Transition, label: 'Transition Node' },
	{ nodeType: NodeType.Completion, label: 'Completion Node' }
];

/** Example nodes shown in their own collapsible palette section. */
export const examplePaletteNodes: PaletteItem[] = [
	{ nodeType: NodeType.CatFacts, label: 'Cat Facts Node' }
];
