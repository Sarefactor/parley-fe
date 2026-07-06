<script lang="ts">
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { page } from '$app/state';
	import { SvelteFlowProvider } from '@xyflow/svelte';
	import AgentOptionsModal from '$lib/components/config/AgentOptionsModal.svelte';
	import NodeOptionsModal from '$lib/components/config/NodeOptionsModal.svelte';
	import Sidebar from '$lib/components/config/Sidebar.svelte';
	import TransitionOptionsModal from '$lib/components/config/TransitionOptionsModal.svelte';
	import WorkflowCanvas from '$lib/components/config/WorkflowCanvas.svelte';
	import WorkflowOptionsModal from '$lib/components/config/WorkflowOptionsModal.svelte';
	import Modal from '$lib/components/config/Modal.svelte';
	import ArrowUp from '@lucide/svelte/icons/arrow-up';
	import ListStart from '@lucide/svelte/icons/list-start';
	import Plus from '@lucide/svelte/icons/plus';
	import Save from '@lucide/svelte/icons/save';
	import Settings from '@lucide/svelte/icons/settings';
	import {
		getAgentSchema,
		getWorkflowSchema,
		setActiveSchema,
		upsertAgentSchema,
		upsertWorkflowSchema,
		UpsertValidationError
	} from '$lib/api/parley-api';
	import { WorkflowErrorType } from '$parleyts/workflow-error-type';
	import { schema } from '$lib/stores/agent-schema-store.svelte';

	/**
	 * The builder edits either a whole agent schema (all its workflows) or a
	 * single standalone workflow. Workflow mode hides the agent-level controls
	 * (agent options, add workflow, set active, workflow dropdown) and saves to
	 * the workflows endpoint instead.
	 */
	let { mode }: { mode: 'agent' | 'workflow' } = $props();

	const isAgentMode = $derived(mode === 'agent');
	const listLabel = $derived(isAgentMode ? 'Agent Schemas' : 'Workflow Schemas');
	const listHref = $derived(isAgentMode ? '/' : '/?tab=workflows');

	let saveStatus = $state('');
	let saveError = $state(false);
	let loading = $state(true);
	let loadError = $state<string | null>(null);
	let confirmLeave = $state(false);
	let showWorkflowErrors = $state(false);

	const currentWorkflowConfigErrors = $derived(
		schema.currentWorkflowErrorMessages(WorkflowErrorType.Config)
	);
	const currentWorkflowSchemaErrors = $derived(
		schema.currentWorkflowErrorMessages(WorkflowErrorType.Schema)
	);

	function goBack(): void {
		if (schema.isDirty) {
			confirmLeave = true;
		} else {
			void goto(listHref);
		}
	}

	onMount(async () => {
		const id = page.url.searchParams.get('id');
		if (!id) {
			// Creating from scratch.
			if (isAgentMode) {
				schema.reset();
			} else {
				schema.resetForWorkflow();
			}
			loading = false;
			return;
		}
		try {
			if (isAgentMode) {
				schema.loadFromDto(await getAgentSchema(id));
			} else {
				schema.loadFromWorkflowDto(await getWorkflowSchema(id));
			}
		} catch (e) {
			loadError =
				e instanceof Error
					? e.message
					: `Failed to load ${isAgentMode ? 'agent' : 'workflow'} schema.`;
		} finally {
			loading = false;
		}
	});

	async function save(): Promise<void> {
		saveError = false;
		saveStatus = 'Saving…';
		try {
			if (isAgentMode) {
				await upsertAgentSchema(schema.toAgentSchemaDto());
			} else {
				await upsertWorkflowSchema(schema.toWorkflowSchemaDto());
			}
			schema.markClean();
			schema.setValidation(null);
			saveStatus = 'Saved';
		} catch (e) {
			saveError = true;
			if (e instanceof UpsertValidationError) {
				schema.setValidation(e.context);
				saveStatus = 'Upsert Failed: Validation Errors';
			} else {
				saveStatus = e instanceof Error ? e.message : 'Save failed';
			}
		}
	}

	async function makeActive(): Promise<void> {
		saveStatus = 'Setting active schema…';
		try {
			await setActiveSchema(schema.agentId);
			saveStatus = 'Active schema set';
		} catch (e) {
			saveStatus = e instanceof Error ? e.message : 'Set active schema failed';
		}
	}
</script>

<svelte:head>
	<title>Parley — Configure {isAgentMode ? 'Agent Schema' : 'Workflow'}</title>
</svelte:head>

<div class="config-page">
	<Sidebar showAgentOptions={isAgentMode} />
	<div class="canvas-area">
		{#if loading}
			<div class="empty-state">
				<span class="load-status">Loading schema…</span>
			</div>
		{:else if loadError}
			<div class="empty-state">
				<span class="load-status error">{loadError}</span>
			</div>
		{:else if schema.workflow}
			<div class="toolbar">
				<button
					type="button"
					class="icon-btn"
					onclick={goBack}
					title={listLabel}
					aria-label={listLabel}
				>
					<ListStart size={18} />
				</button>
				{#if isAgentMode}
					<button
						type="button"
						class="icon-btn"
						onclick={() => schema.createWorkflow()}
						title="Add Workflow"
						aria-label="Add Workflow"
					>
						<Plus size={18} strokeWidth={3} />
					</button>
				{/if}
				<button
					type="button"
					class="icon-btn"
					class:error-border={currentWorkflowConfigErrors.length > 0}
					onclick={() => schema.openWorkflowOptions()}
					title="Configure Workflow"
					aria-label="Configure Workflow"
				>
					<Settings size={18} />
				</button>
				<button
					type="button"
					class="icon-btn"
					onclick={() => void save()}
					title="Save"
					aria-label="Save"
				>
					<Save size={18} />
				</button>
				{#if isAgentMode}
					<button
						type="button"
						class="icon-btn"
						onclick={() => void makeActive()}
						title="Set Active Schema"
						aria-label="Set Active Schema"
					>
						<ArrowUp size={18} strokeWidth={3} />
					</button>
					<select
						class="workflow-select"
						class:error-border={schema.hasWorkflowErrors}
						bind:value={schema.currentIndex}
						aria-label="Workflow"
					>
						{#each schema.workflows as workflow, i (i)}
							<option value={i}>
								{schema.workflowErrorsFor(workflow.executionNodeId) ? '⚠ ' : ''}{workflow.name ||
									`Workflow ${i + 1}`}
							</option>
						{/each}
					</select>
				{/if}
				{#if saveStatus}
					<span class="save-status" class:error={saveError}>{saveStatus}</span>
				{/if}
			</div>
			{#if currentWorkflowSchemaErrors.length > 0}
				<div class="toolbar toolbar-second">
					<button type="button" class="error-btn" onclick={() => (showWorkflowErrors = true)}>
						Workflow Errors
					</button>
				</div>
			{/if}
			{#key schema.workflow}
				<SvelteFlowProvider>
					<WorkflowCanvas />
				</SvelteFlowProvider>
			{/key}
		{:else}
			<div class="empty-state">
				<button type="button" class="accent-btn" onclick={() => schema.createWorkflow()}>
					Add New Workflow +
				</button>
			</div>
		{/if}
	</div>
</div>

{#if showWorkflowErrors}
	<Modal title="Workflow Errors" onclose={() => (showWorkflowErrors = false)}>
		<ul class="workflow-error-list">
			{#each currentWorkflowSchemaErrors as error, i (i)}
				<li>{error}</li>
			{/each}
		</ul>
	</Modal>
{/if}

{#if confirmLeave}
	<Modal title="Unsaved Changes" onclose={() => (confirmLeave = false)}>
		<p class="confirm-text">
			You have unsaved changes. Abandon them and return to the {listLabel} list?
		</p>
		<div class="confirm-actions">
			<button type="button" class="cancel-btn" onclick={() => (confirmLeave = false)}>
				Cancel
			</button>
			<button type="button" class="danger" onclick={() => void goto(listHref)}>
				Abandon Changes
			</button>
		</div>
	</Modal>
{/if}

{#if schema.modal?.kind === 'agent'}
	<AgentOptionsModal />
{:else if schema.modal?.kind === 'workflow'}
	<WorkflowOptionsModal />
{:else if schema.modal?.kind === 'node'}
	<NodeOptionsModal nodeId={schema.modal.nodeId} />
{:else if schema.modal?.kind === 'transition'}
	<TransitionOptionsModal sourceId={schema.modal.sourceId} targetId={schema.modal.targetId} />
{/if}

<style>
	.config-page {
		display: flex;
		height: calc(100vh - var(--titlebar-height));
	}

	.canvas-area {
		position: relative;
		flex: 1;
		min-width: 0;
		border-left: 1px solid var(--border-subtle);
	}

	.toolbar {
		position: absolute;
		top: 1.25rem;
		left: 1rem;
		z-index: 5;
		display: flex;
		align-items: center;
		gap: 0.6rem;
	}

	.icon-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 38px;
		height: 38px;
		background: var(--bg-raised);
		color: var(--accent);
		border: 1px solid var(--border-subtle);
		border-radius: 8px;
		cursor: pointer;
	}

	.icon-btn:hover {
		background: rgba(79, 143, 230, 0.12);
		border-color: var(--accent-soft);
		color: var(--text);
	}

	.workflow-select {
		background: var(--bg-raised);
		border: 1px solid var(--border-subtle);
		color: var(--text);
		border-radius: 6px;
		padding: 0.55rem 0.6rem;
		font: inherit;
		font-size: 0.85rem;
		max-width: 220px;
	}

	.save-status {
		color: var(--text-dim);
		font-size: 0.85rem;
	}

	.save-status.error {
		color: #e07878;
	}

	.icon-btn.error-border,
	.workflow-select.error-border {
		border-color: rgba(224, 120, 120, 0.7);
	}

	.toolbar.toolbar-second {
		top: calc(1.25rem + 38px + 0.6rem);
	}

	.error-btn {
		height: 38px;
		display: flex;
		align-items: center;
		background: var(--bg-raised);
		border: 1px solid rgba(224, 120, 120, 0.7);
		color: #e07878;
		border-radius: 8px;
		padding: 0 0.9rem;
		font: inherit;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
	}

	.error-btn:hover {
		background: rgba(224, 120, 120, 0.12);
	}

	.workflow-error-list {
		margin: 0;
		padding: 0 0 0 1.1rem;
	}

	.workflow-error-list li {
		color: var(--text-dim);
		font-size: 0.9rem;
		margin-bottom: 0.5rem;
	}

	.empty-state {
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.load-status {
		color: var(--text-dim);
	}

	.load-status.error {
		color: #e07878;
	}

	.confirm-text {
		margin: 0 0 1rem;
		font-size: 0.9rem;
		color: var(--text-dim);
	}

	.confirm-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.6rem;
	}

	.cancel-btn {
		background: transparent;
		border: 1px solid var(--border-subtle);
		color: var(--text-dim);
		border-radius: 6px;
		padding: 0.35rem 0.7rem;
		font: inherit;
		font-size: 0.8rem;
		cursor: pointer;
	}

	.cancel-btn:hover {
		color: var(--text);
		border-color: var(--accent-soft);
	}
</style>
