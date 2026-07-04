<script lang="ts">
	import { Handle, Position, type NodeProps } from '@xyflow/svelte';
	import BaseNode from './BaseNode.svelte';

	let { id }: NodeProps = $props();
</script>

<BaseNode nodeId={id} title="Completion Node">
	<span>Node Id: {id}</span>
</BaseNode>
<Handle type="target" position={Position.Left} />
