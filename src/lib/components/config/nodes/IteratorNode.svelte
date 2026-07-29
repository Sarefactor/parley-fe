<script lang="ts">
	import { Handle, Position, type NodeProps } from '@xyflow/svelte';
	import BaseNode from './BaseNode.svelte';
	import { schema, type IteratorNodeOptions } from '$lib/stores/agent-schema-store.svelte';

	let { id }: NodeProps = $props();

	const config = $derived(schema.getNode(id));
	const options = $derived(config?.nodeOptions as IteratorNodeOptions | undefined);
</script>

<BaseNode nodeId={id} title="Iterator Node">
	<div class="opt truncate"><span class="key">Target Key:</span> {options?.targetKey || '—'}</div>
</BaseNode>
<Handle type="target" position={Position.Left} />
<Handle type="source" position={Position.Right} id="primary" class="handle-primary" />
<Handle type="source" position={Position.Right} id="secondary" class="handle-secondary" />

<style>
	.opt.truncate {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.key {
		color: var(--text);
	}
</style>
