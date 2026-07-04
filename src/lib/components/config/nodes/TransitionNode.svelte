<script lang="ts">
	import { Handle, Position, type NodeProps } from '@xyflow/svelte';
	import BaseNode from './BaseNode.svelte';
	import { schema } from '$lib/stores/agent-schema-store.svelte';

	let { id }: NodeProps = $props();

	const config = $derived(schema.getNode(id));
</script>

<BaseNode nodeId={id} title="Transition Node">
	<span>Node Id: {id}</span>
	<div class="opt">
		<span class="key">Transitions:</span>
		{config?.transitions.length ?? 0}
	</div>
</BaseNode>
<Handle type="target" position={Position.Left} />
<Handle type="source" position={Position.Right} id="primary" class="handle-primary" />
<Handle type="source" position={Position.Right} id="transitions" class="handle-transitions" />

<style>
	.opt {
		margin-top: 0.25rem;
	}

	.key {
		color: var(--text);
	}
</style>
