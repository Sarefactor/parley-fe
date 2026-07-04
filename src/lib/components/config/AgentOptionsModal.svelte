<script lang="ts">
	import Modal from './Modal.svelte';
	import { schema } from '$lib/stores/agent-schema-store.svelte';
</script>

<Modal title="Agent Schema Options" errors={schema.agentErrors} onclose={() => schema.closeModal()}>
	<p class="muted">Id: {schema.agentId}</p>
	<label class="field">
		<span>Name</span>
		<input bind:value={schema.agentName} />
	</label>
	<label class="field">
		<span>Instructions</span>
		<textarea rows="5" bind:value={schema.agentInstructions}></textarea>
	</label>
</Modal>

<style>
	.muted {
		color: var(--text-dim);
		font-size: 0.8rem;
		margin: 0 0 0.75rem;
	}
</style>
