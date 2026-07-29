<script lang="ts">
	import {
		Controls,
		SvelteFlow,
		useSvelteFlow,
		type Connection,
		type Edge,
		type Node,
		type NodeTypes
	} from '@xyflow/svelte';
	import '@xyflow/svelte/dist/style.css';
	import { NodeType, type NodeTypeId } from '$lib/config-builder/node-types';
	import { schema } from '$lib/stores/agent-schema-store.svelte';
	import type { NodeConfigDto } from '$parleyts/node-config-dto';
	import CatFactsNode from './nodes/CatFactsNode.svelte';
	import ChoiceNode from './nodes/ChoiceNode.svelte';
	import ClassificationNode from './nodes/ClassificationNode.svelte';
	import CompletionNode from './nodes/CompletionNode.svelte';
	import ConfirmationNode from './nodes/ConfirmationNode.svelte';
	import ExecutionNode from './nodes/ExecutionNode.svelte';
	import GenerationNode from './nodes/GenerationNode.svelte';
	import HttpRequestNode from './nodes/HttpRequestNode.svelte';
	import InputNode from './nodes/InputNode.svelte';
	import IteratorNode from './nodes/IteratorNode.svelte';
	import MessageNode from './nodes/MessageNode.svelte';
	import TransitionNode from './nodes/TransitionNode.svelte';

	const nodeTypes: NodeTypes = {
		[NodeType.Execution]: ExecutionNode,
		[NodeType.Completion]: CompletionNode,
		[NodeType.Message]: MessageNode,
		[NodeType.Input]: InputNode,
		[NodeType.Confirmation]: ConfirmationNode,
		[NodeType.Choice]: ChoiceNode,
		[NodeType.Classification]: ClassificationNode,
		[NodeType.HttpRequest]: HttpRequestNode,
		[NodeType.Generation]: GenerationNode,
		[NodeType.Iterator]: IteratorNode,
		[NodeType.Transition]: TransitionNode,
		[NodeType.CatFacts]: CatFactsNode
	};

	function toFlowNode(config: NodeConfigDto): Node {
		return {
			id: config.nodeId,
			type: config.nodeType,
			position: { x: config.position.x, y: config.position.y },
			// The execution node can never be removed.
			deletable: config.nodeType !== NodeType.Execution,
			data: {}
		};
	}

	/** Rebuilds the edge list from the node configs (primary transitions + transition lists). */
	function buildEdges(nodeConfigs: Record<string, NodeConfigDto>): Edge[] {
		const result: Edge[] = [];
		for (const config of Object.values(nodeConfigs)) {
			if (
				config.primaryTransitionNode &&
				config.primaryTransitionNode !== config.nodeId &&
				nodeConfigs[config.primaryTransitionNode]
			) {
				result.push({
					id: `e-${config.nodeId}-primary-${config.primaryTransitionNode}`,
					source: config.nodeId,
					sourceHandle: 'primary',
					target: config.primaryTransitionNode
				});
			}
			if (config.secondaryTransitionNode && nodeConfigs[config.secondaryTransitionNode]) {
				result.push({
					id: `e-${config.nodeId}-secondary-${config.secondaryTransitionNode}`,
					source: config.nodeId,
					sourceHandle: 'secondary',
					target: config.secondaryTransitionNode
				});
			}
			for (const transition of config.transitions) {
				if (nodeConfigs[transition.targetNodeId]) {
					result.push({
						id: `e-${config.nodeId}-transitions-${transition.targetNodeId}`,
						source: config.nodeId,
						sourceHandle: 'transitions',
						target: transition.targetNodeId
					});
				}
			}
		}
		return result;
	}

	let nodes = $state.raw<Node[]>(Object.values(schema.workflow?.nodes ?? {}).map(toFlowNode));
	let edges = $state.raw<Edge[]>(buildEdges(schema.workflow?.nodes ?? {}));

	const { screenToFlowPosition } = useSvelteFlow();

	function ondragover(event: DragEvent): void {
		event.preventDefault();
		if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
	}

	function ondrop(event: DragEvent): void {
		event.preventDefault();
		const nodeType = event.dataTransfer?.getData('application/parley-node');
		if (!nodeType) return;
		const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
		const config = schema.addNode(nodeType as NodeTypeId, position);
		if (config) nodes = [...nodes, toFlowNode(config)];
	}

	function handleConnect(connection: Connection): void {
		if (connection.sourceHandle === 'transitions') {
			schema.addTransition(connection.source, connection.target);
			return;
		}
		// Primary/secondary transitions allow a single outgoing connection each,
		// so replace any existing edge from the same handle.
		edges = edges.filter(
			(edge) =>
				!(
					edge.source === connection.source &&
					edge.sourceHandle === connection.sourceHandle &&
					edge.target !== connection.target
				)
		);
		if (connection.sourceHandle === 'secondary') {
			schema.setSecondaryTransition(connection.source, connection.target);
		} else {
			schema.setPrimaryTransition(connection.source, connection.target);
		}
	}

	function handleDelete({ nodes: deletedNodes, edges: deletedEdges }: { nodes: Node[]; edges: Edge[] }): void {
		for (const edge of deletedEdges) {
			if (edge.sourceHandle === 'transitions') schema.removeTransition(edge.source, edge.target);
			else if (edge.sourceHandle === 'secondary') schema.setSecondaryTransition(edge.source, null);
			else schema.setPrimaryTransition(edge.source, null);
		}
		for (const node of deletedNodes) schema.removeNode(node.id);
	}

	function handleEdgeClick({ edge }: { edge: Edge; event: MouseEvent }): void {
		if (edge.sourceHandle === 'transitions') schema.openTransitionOptions(edge.source, edge.target);
	}

	/** Syncs current canvas positions back into the node configs. */
	function syncPositions(): void {
		for (const node of nodes) {
			const config = schema.getNode(node.id);
			if (config) config.position = { x: node.position.x, y: node.position.y };
		}
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<div class="canvas" {ondragover} {ondrop}>
	<SvelteFlow
		bind:nodes
		bind:edges
		{nodeTypes}
		colorMode="dark"
		onconnect={handleConnect}
		ondelete={handleDelete}
		onedgeclick={handleEdgeClick}
		onnodedragstop={syncPositions}
		deleteKey={['Delete', 'Backspace']}
		connectionRadius={36}
	>
		<Controls position="bottom-left" />
	</SvelteFlow>
</div>

<style>
	.canvas {
		width: 100%;
		height: 100%;
	}

	.canvas :global(.svelte-flow) {
		background: transparent !important;
	}

	.canvas :global(.svelte-flow__handle) {
		position: absolute;
		width: 16px;
		height: 16px;
		background: var(--accent);
		border: 2px solid var(--bg-titlebar);
		transition: box-shadow 0.1s ease;
	}

	/* Invisible halo that extends the grab/hover area well beyond the dot. */
	.canvas :global(.svelte-flow__handle::before) {
		content: '';
		position: absolute;
		inset: -10px;
	}

	.canvas :global(.svelte-flow__handle:hover) {
		box-shadow: 0 0 0 4px rgba(79, 143, 230, 0.35);
	}

	.canvas :global(.svelte-flow__handle.handle-primary) {
		top: 30%;
	}

	.canvas :global(.svelte-flow__handle.handle-secondary) {
		top: 70%;
		background: var(--text-dim);
	}

	.canvas :global(.svelte-flow__handle.handle-transitions) {
		top: 70%;
		background: var(--text-dim);
	}

	.canvas :global(.svelte-flow__edge-path) {
		stroke-width: 2;
	}

	/* xyflow assigns each node wrapper its own z-index (raised when selected),
	   which traps tooltips beneath later-clicked nodes. Elevate the hovered
	   node above everything so its error tooltip always renders on top. */
	.canvas :global(.svelte-flow__node:hover) {
		z-index: 2000 !important;
	}
</style>
