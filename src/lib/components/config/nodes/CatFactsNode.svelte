<script lang="ts">
	import { Handle, Position, type NodeProps } from '@xyflow/svelte';
	import BaseNode from './BaseNode.svelte';

	let { id }: NodeProps = $props();
</script>

<BaseNode nodeId={id} title="Cat Facts Node">
	<span>Node Id: {id}</span>
</BaseNode>
<Handle type="target" position={Position.Left} />
<Handle type="source" position={Position.Right} id="primary" class="handle-primary" />
<Handle type="source" position={Position.Right} id="secondary" class="handle-secondary" />
