<script lang="ts">
	import { Handle, Position, type NodeProps } from '@xyflow/svelte';
	import BaseNode from './BaseNode.svelte';
	import { httpMethodOptions } from '$lib/config-builder/enum-options';
	import { schema, type HttpRequestNodeOptions } from '$lib/stores/agent-schema-store.svelte';

	let { id }: NodeProps = $props();

	const config = $derived(schema.getNode(id));
	const options = $derived(config?.nodeOptions as HttpRequestNodeOptions | undefined);
	const methodLabel = $derived(
		httpMethodOptions.find((o) => o.value === options?.methodType)?.label ?? '—'
	);
</script>

<BaseNode nodeId={id} title="Http Request Node">
	<div class="opt truncate"><span class="key">Url:</span> {options?.url || '—'}</div>
	<div class="opt"><span class="key">Method:</span> {methodLabel}</div>
	<div class="opt">
		<span class="key">Request Parameters:</span>
		{options?.requestParameters.length ?? 0}
	</div>
	<div class="opt">
		<span class="key">Response Mappings:</span>
		{options?.responseMappings.length ?? 0}
	</div>
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
