<script lang="ts">
	import type { Snippet } from 'svelte';
	import { schema } from '$lib/stores/agent-schema-store.svelte';
	import { WorkflowErrorType } from '$parleyts/workflow-error-type';

	let { nodeId, title, children }: { nodeId: string; title: string; children?: Snippet } =
		$props();

	let expanded = $state(false);

	const hasErrors = $derived(schema.nodeErrorDetails(nodeId).length > 0);
	const schemaErrors = $derived(schema.nodeErrorMessages(nodeId, WorkflowErrorType.Schema));
</script>

<div class="parley-node" class:error={hasErrors}>
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<header ondblclick={() => schema.openNodeOptions(nodeId)}>{title}</header>
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div
		class="body"
		class:expanded
		ondblclick={(e) => {
			e.stopPropagation();
			expanded = !expanded;
		}}
	>
		{@render children?.()}
	</div>
	{#if schemaErrors.length > 0}
		<div class="node-errors" role="tooltip">
			<h4>Errors</h4>
			<ul>
				{#each schemaErrors as error, i (i)}
					<li>{error}</li>
				{/each}
			</ul>
		</div>
	{/if}
</div>

<style>
	.parley-node {
		position: relative;
		min-width: 240px;
		max-width: 300px;
		background: var(--bg-raised);
		border: 1px solid var(--border-subtle);
		border-radius: 8px;
		font-size: 0.8rem;
		color: var(--text-dim);
		transition:
			border-color 0.12s ease,
			box-shadow 0.12s ease;
	}

	/* Brighter border + soft halo while hovered. */
	.parley-node:hover {
		border-color: var(--accent);
		box-shadow:
			0 0 0 1px rgba(79, 143, 230, 0.25),
			0 0 18px rgba(79, 143, 230, 0.28);
	}

	.parley-node.error {
		border-color: rgba(224, 120, 120, 0.8);
	}

	/* Error nodes keep their red identity when hovered. */
	.parley-node.error:hover {
		border-color: #e07878;
		box-shadow:
			0 0 0 1px rgba(224, 120, 120, 0.3),
			0 0 18px rgba(224, 120, 120, 0.32);
	}

	header {
		padding: 0.5rem 0.8rem;
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--text);
		background: var(--bg-titlebar);
		border-bottom: 1px solid var(--accent-soft);
		border-radius: 8px 8px 0 0;
		cursor: default;
	}

	.body {
		padding: 0.6rem 0.8rem;
		max-height: 96px;
		overflow: hidden;
	}

	.body.expanded {
		max-height: none;
	}

	/* Schema-error tooltip, shown while hovering the node. */
	.node-errors {
		display: none;
		position: absolute;
		left: calc(100% + 14px);
		top: 0;
		width: 240px;
		background: var(--bg-raised);
		border: 1px solid rgba(224, 120, 120, 0.45);
		border-radius: 8px;
		padding: 0.6rem 0.75rem;
		z-index: 20;
	}

	.parley-node:hover .node-errors {
		display: block;
	}

	.node-errors h4 {
		margin: 0 0 0.4rem;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #e07878;
	}

	.node-errors ul {
		margin: 0;
		padding: 0 0 0 1rem;
	}

	.node-errors li {
		color: var(--text-dim);
		font-size: 0.78rem;
		margin-bottom: 0.35rem;
	}
</style>
