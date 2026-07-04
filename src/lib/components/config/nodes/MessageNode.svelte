<script lang="ts">
	import { Handle, Position, type NodeProps } from '@xyflow/svelte';
	import BaseNode from './BaseNode.svelte';
	import { schema, type MessageNodeOptions } from '$lib/stores/agent-schema-store.svelte';

	let { id }: NodeProps = $props();

	const config = $derived(schema.getNode(id));
	const message = $derived((config?.nodeOptions as MessageNodeOptions | undefined)?.message ?? '');
</script>

<BaseNode nodeId={id} title="Message Node">
	<div class="opt truncate"><span class="key">Message:</span> {message || '—'}</div>
</BaseNode>
<Handle type="target" position={Position.Left} />
<Handle type="source" position={Position.Right} id="primary" />

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
