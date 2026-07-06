<script lang="ts">
	import { defaultPaletteNodes } from '$lib/config-builder/node-types';
	import { schema } from '$lib/stores/agent-schema-store.svelte';

	let { showAgentOptions = true }: { showAgentOptions?: boolean } = $props();

	let collapsed = $state(false);
	let filter = $state('');
	let groupOpen = $state(true);

	const filtered = $derived(
		defaultPaletteNodes.filter((item) =>
			item.label.toLowerCase().includes(filter.trim().toLowerCase())
		)
	);

	function dragStart(event: DragEvent, nodeType: string): void {
		event.dataTransfer?.setData('application/parley-node', nodeType);
		if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
	}
</script>

<aside class:collapsed>
	{#if showAgentOptions}
		<button
			type="button"
			class="schema-options"
			class:error-border={schema.agentErrors.length > 0}
			onclick={() => schema.openAgentOptions()}
		>
			Agent Schema Options
		</button>
	{/if}
	<input class="filter" placeholder="Filter nodes..." bind:value={filter} />
	<button type="button" class="group-header" onclick={() => (groupOpen = !groupOpen)}>
		<span class="chevron" class:open={groupOpen}>▸</span>
		Default Nodes
	</button>
	{#if groupOpen}
		<ul class="palette">
			{#each filtered as item (item.nodeType)}
				<li draggable="true" ondragstart={(e) => dragStart(e, item.nodeType)}>
					{item.label}
				</li>
			{/each}
		</ul>
	{/if}
</aside>
<button
	type="button"
	class="collapse-toggle"
	onclick={() => (collapsed = !collapsed)}
	aria-label={collapsed ? 'Expand menu' : 'Collapse menu'}
>
	{collapsed ? '▶' : '◀'}
</button>

<style>
	aside {
		width: 250px;
		flex-shrink: 0;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		gap: 0.6rem;
		padding: 0.75rem;
		background: var(--bg-titlebar);
		transition: width 0.15s ease;
	}

	aside.collapsed {
		width: 0;
		padding: 0.75rem 0;
	}

	.schema-options {
		background: var(--bg-raised);
		border: 1px solid var(--border-subtle);
		color: var(--text-dim);
		border-radius: 6px;
		padding: 0.5rem;
		font: inherit;
		font-size: 0.85rem;
		cursor: pointer;
		white-space: nowrap;
	}

	.schema-options:hover {
		color: var(--text);
		border-color: var(--accent-soft);
	}

	.schema-options.error-border,
	.schema-options.error-border:hover {
		border-color: rgba(224, 120, 120, 0.7);
	}

	.filter {
		background: var(--bg-raised);
		border: 1px solid var(--border-subtle);
		color: var(--text);
		border-radius: 6px;
		padding: 0.45rem 0.6rem;
		font: inherit;
		font-size: 0.85rem;
	}

	.group-header {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		background: transparent;
		border: none;
		color: var(--text-dim);
		font-size: 0.72rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		padding: 0.25rem 0;
		cursor: pointer;
		white-space: nowrap;
	}

	.chevron {
		display: inline-block;
		transition: transform 0.1s ease;
	}

	.chevron.open {
		transform: rotate(90deg);
	}

	.palette {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 0.45rem;
	}

	.palette li {
		background: var(--bg-raised);
		border: 1px solid var(--border-subtle);
		border-radius: 6px;
		padding: 0.5rem 0.7rem;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text);
		cursor: grab;
		white-space: nowrap;
	}

	.palette li:hover {
		border-color: var(--accent-soft);
	}

	.collapse-toggle {
		flex-shrink: 0;
		width: 16px;
		background: transparent;
		border: none;
		color: var(--text-dim);
		font-size: 0.6rem;
		cursor: pointer;
		padding: 0;
	}

	.collapse-toggle:hover {
		color: var(--text);
	}
</style>
