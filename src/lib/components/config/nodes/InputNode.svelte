<script lang="ts">
	import { Handle, Position, type NodeProps } from '@xyflow/svelte';
	import BaseNode from './BaseNode.svelte';
	import { schema, type InputNodeOptions } from '$lib/stores/agent-schema-store.svelte';

	let { id }: NodeProps = $props();

	const config = $derived(schema.getNode(id));
	const options = $derived(config?.nodeOptions as InputNodeOptions | undefined);
</script>

<BaseNode nodeId={id} title="Input Node">
	<div class="opt truncate"><span class="key">Message:</span> {options?.message || '—'}</div>
	<div class="opt">
		<span class="key">Validation Rules:</span>
		{config?.validationRules.length ?? 0}
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
