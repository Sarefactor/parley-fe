<script lang="ts">
	import { onMount } from 'svelte';
	import { goto, replaceState } from '$app/navigation';
	import { page as appPage } from '$app/state';
	import type { AgentSchemaSearchItemDto } from '$parleyts/agent-schema-search-item-dto';
	import { searchAgentSchemas, searchWorkflowSchemas } from '$lib/api/parley-api';
	import { config } from '$lib/config';

	type SchemaTab = 'agents' | 'workflows';

	let tab = $state<SchemaTab>('agents');
	let items = $state<AgentSchemaSearchItemDto[]>([]);
	let totalResults = $state(0);
	let pageSize = $state<number>(config.search.defaultPageSize);
	let page = $state(0); // 0-based: skip = page * pageSize
	let loading = $state(true);
	let error = $state<string | null>(null);

	const heading = $derived(tab === 'agents' ? 'Agent Schemas' : 'Workflow Schemas');
	const configPath = $derived(tab === 'agents' ? '/agents/config' : '/workflows/config');

	const totalPages = $derived(Math.max(1, Math.ceil(totalResults / pageSize)));
	const rangeStart = $derived(totalResults === 0 ? 0 : page * pageSize + 1);
	const rangeEnd = $derived(Math.min(page * pageSize + items.length, totalResults));

	/** Up to 5 page buttons, windowed around the current page. */
	const pageNumbers = $derived.by(() => {
		const maxButtons = 5;
		let start = Math.max(0, page - Math.floor(maxButtons / 2));
		const end = Math.min(totalPages, start + maxButtons);
		start = Math.max(0, end - maxButtons);
		return Array.from({ length: end - start }, (_, i) => start + i);
	});

	async function load(): Promise<void> {
		loading = true;
		error = null;
		try {
			const search = tab === 'agents' ? searchAgentSchemas : searchWorkflowSchemas;
			const result = await search(page * pageSize, pageSize);
			items = result.results;
			totalResults = result.totalResults;
			pageSize = result.pageSize;
			// The API's page is 1-based; local page is 0-based (skip = page * pageSize).
			page = Math.max(0, result.page - 1);
		} catch (e) {
			error = e instanceof Error ? e.message : `Failed to load ${heading.toLowerCase()}.`;
		} finally {
			loading = false;
		}
	}

	function selectTab(target: SchemaTab): void {
		if (target === tab) return;
		tab = target;
		page = 0;
		items = [];
		totalResults = 0;
		// Keep the toggle restorable (e.g. the builder's back button links to /?tab=workflows).
		replaceState(target === 'workflows' ? '/?tab=workflows' : '/', {});
		void load();
	}

	function goToPage(target: number): void {
		if (target < 0 || target >= totalPages || target === page) return;
		page = target;
		void load();
	}

	function changePageSize(): void {
		page = 0;
		void load();
	}

	onMount(() => {
		if (appPage.url.searchParams.get('tab') === 'workflows') tab = 'workflows';
		void load();
	});

	function openSchema(id: string): void {
		void goto(`${configPath}?id=${encodeURIComponent(id)}`);
	}

	function formatDate(value: Date | string): string {
		return new Date(value).toLocaleString(undefined, {
			dateStyle: 'medium',
			timeStyle: 'short'
		});
	}
</script>

<svelte:head>
	<title>Parley — {heading}</title>
</svelte:head>

<section class="panel">
	<div class="tab-toggle" role="tablist" aria-label="Schema type">
		<button
			type="button"
			role="tab"
			aria-selected={tab === 'agents'}
			class:active={tab === 'agents'}
			onclick={() => selectTab('agents')}
		>
			Agent Schemas
		</button>
		<button
			type="button"
			role="tab"
			aria-selected={tab === 'workflows'}
			class:active={tab === 'workflows'}
			onclick={() => selectTab('workflows')}
		>
			Workflow Schemas
		</button>
	</div>

	<div class="panel-header">
		<h1>{heading}</h1>
		<a class="create-btn" href={configPath}>Create +</a>
	</div>

	{#if loading}
		<p class="status">Loading…</p>
	{:else if error}
		<div class="status error">
			<p>{error}</p>
			<button onclick={() => void load()}>Retry</button>
		</div>
	{:else if items.length === 0}
		<p class="status">No {heading.toLowerCase()} found.</p>
	{:else}
		<table>
			<thead>
				<tr>
					<th>Name</th>
					<th>Id</th>
					<th>Last Modified</th>
				</tr>
			</thead>
			<tbody>
				{#each items as item (item.id)}
					<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
					<tr class="clickable" onclick={() => openSchema(item.id)}>
						<td>{item.name}</td>
						<td class="id">{item.id}</td>
						<td>{formatDate(item.lastModified)}</td>
					</tr>
				{/each}
			</tbody>
		</table>

		<div class="panel-footer">
			<span class="count">
				Showing {rangeStart}–{rangeEnd} of {totalResults} results
			</span>

			<div class="pager-group">
				<label class="page-size">
					<span>Per page</span>
					<select bind:value={pageSize} onchange={changePageSize} aria-label="Results per page">
						{#each config.search.pageSizeOptions as size (size)}
							<option value={size}>{size}</option>
						{/each}
					</select>
				</label>

				<nav class="pager" aria-label="Search result pages">
				<button onclick={() => goToPage(0)} disabled={page === 0} aria-label="First page">
					«
				</button>
				<button onclick={() => goToPage(page - 1)} disabled={page === 0} aria-label="Previous page">
					‹
				</button>

				{#each pageNumbers as n (n)}
					<button
						class:current={n === page}
						aria-current={n === page ? 'page' : undefined}
						onclick={() => goToPage(n)}
					>
						{n + 1}
					</button>
				{/each}

				<button
					onclick={() => goToPage(page + 1)}
					disabled={page >= totalPages - 1}
					aria-label="Next page"
				>
					›
				</button>
					<button
						onclick={() => goToPage(totalPages - 1)}
						disabled={page >= totalPages - 1}
						aria-label="Last page"
					>
						»
					</button>
				</nav>
			</div>
		</div>
	{/if}
</section>

<style>
	.panel {
		max-width: 1280px;
		margin: 100px auto 2rem;
		background: var(--bg-raised);
		border: 1px solid var(--border-subtle);
		border-radius: 8px;
		padding: 1.25rem 1.5rem;
	}

	.tab-toggle {
		display: flex;
		width: fit-content;
		background: var(--bg-titlebar);
		border: 1px solid var(--border-subtle);
		border-radius: 8px;
		padding: 0.25rem;
		gap: 0.25rem;
		margin: 0 auto calc(1rem + 20px);
	}

	.tab-toggle button {
		min-width: unset;
		border: 1px solid transparent;
		color: var(--text-dim);
		border-radius: 6px;
		padding: 0.4rem 0.9rem;
		font-size: 0.85rem;
		font-weight: 600;
	}

	.tab-toggle button:hover:not(.active) {
		color: var(--text);
		background: rgba(79, 143, 230, 0.08);
	}

	.tab-toggle button.active {
		background: rgba(79, 143, 230, 0.2);
		border-color: var(--accent);
		color: var(--text);
		cursor: default;
	}

	.panel-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1rem;
	}

	h1 {
		font-size: 1.15rem;
		font-weight: 600;
		margin: 0;
	}

	.create-btn {
		background: #86b3f0;
		color: var(--bg-titlebar);
		font-weight: 600;
		font-size: 0.85rem;
		border-radius: 6px;
		padding: 0.45rem 0.9rem;
		text-decoration: none;
	}

	.create-btn:hover {
		filter: brightness(1.1);
	}

	table {
		width: 100%;
		border-collapse: collapse;
		table-layout: fixed; /* three evenly spaced columns */
	}

	th,
	td {
		text-align: left;
		padding: 0.6rem 0.75rem;
		border-bottom: 1px solid var(--border-subtle);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	th {
		color: var(--text-dim);
		font-size: 0.78rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
	}

	td.id {
		font-family: 'Cascadia Code', Consolas, monospace;
		font-size: 0.85rem;
		color: var(--text-dim);
	}

	tbody tr.clickable {
		cursor: pointer;
	}

	tbody tr:hover {
		background: rgba(79, 143, 230, 0.07);
	}

	.panel-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-top: 1rem;
	}

	.count {
		color: var(--text-dim);
		font-size: 0.85rem;
	}

	.pager-group {
		display: flex;
		align-items: center;
		gap: 1rem;
	}

	.page-size {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		color: var(--text-dim);
		font-size: 0.85rem;
	}

	.page-size select {
		background: var(--bg);
		border: 1px solid var(--border-subtle);
		color: var(--text);
		border-radius: 6px;
		padding: 0.35rem 0.5rem;
		font: inherit;
		font-size: 0.85rem;
		cursor: pointer;
	}

	.page-size select:focus {
		outline: 1px solid var(--accent-soft);
	}

	.pager {
		display: flex;
		gap: 0.3rem;
	}

	.status {
		color: var(--text-dim);
		padding: 1rem 0.25rem;
	}

	.status.error p {
		color: #e07878;
		margin: 0 0 0.75rem;
	}

	button {
		min-width: 2.1rem;
		background: transparent;
		border: 1px solid var(--accent-soft);
		color: var(--accent);
		border-radius: 6px;
		padding: 0.35rem 0.6rem;
		font: inherit;
		font-size: 0.85rem;
		cursor: pointer;
	}

	button:hover:not(:disabled) {
		background: rgba(79, 143, 230, 0.12);
	}

	button:disabled {
		opacity: 0.35;
		cursor: default;
	}

	button.current {
		background: rgba(79, 143, 230, 0.2);
		color: var(--text);
		border-color: var(--accent);
	}
</style>
