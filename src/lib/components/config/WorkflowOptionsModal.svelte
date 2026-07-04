<script lang="ts">
	import Modal from './Modal.svelte';
	import VariablesEditor from './VariablesEditor.svelte';
	import { schema } from '$lib/stores/agent-schema-store.svelte';
	import { WorkflowErrorType } from '$parleyts/workflow-error-type';
</script>

<Modal
	title="Configure Workflow"
	errors={schema.currentWorkflowErrorMessages(WorkflowErrorType.Config)}
	onclose={() => schema.closeModal()}
	wide
>
	{#if schema.workflow}
		<label class="field">
			<span>Name</span>
			<input bind:value={schema.workflow.name} />
		</label>
		<label class="field">
			<span>Intent</span>
			<input bind:value={schema.workflow.intent} />
		</label>
		<label class="field">
			<span>Description</span>
			<textarea rows="3" bind:value={schema.workflow.description}></textarea>
		</label>

		<h3>Workflow Variables</h3>
		<VariablesEditor bind:variables={schema.workflow.workflowVariables} />
	{/if}
</Modal>

<style>
	h3 {
		font-size: 0.85rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-dim);
		margin: 1.25rem 0 0.6rem;
	}
</style>
