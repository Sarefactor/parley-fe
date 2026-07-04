<script lang="ts">
	import { Handle, Position, type NodeProps } from '@xyflow/svelte';
	import BaseNode from './BaseNode.svelte';
	import { schema, type ClassificationNodeOptions } from '$lib/stores/agent-schema-store.svelte';

	let { id }: NodeProps = $props();

	const config = $derived(schema.getNode(id));
	const options = $derived(config?.nodeOptions as ClassificationNodeOptions | undefined);
</script>

<BaseNode nodeId={id} title="Classification Node">
	<div class="opt truncate"><span class="key">Target Key:</span> {options?.targetKey || '—'}</div>
	<div class="opt">
		<span class="key">Variables:</span>
		{config?.nodeVariables.length ?? 0}
	</div>
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
