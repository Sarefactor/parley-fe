<script lang="ts">
	import { Handle, Position, type NodeProps } from '@xyflow/svelte';
	import BaseNode from './BaseNode.svelte';

	let { id }: NodeProps = $props();
</script>

<BaseNode nodeId={id} title="Execution Node">
	<span>Node Id: {id}</span>
</BaseNode>
<Handle type="source" position={Position.Right} id="primary" />
